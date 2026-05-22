import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import re
import sys
import os

# Windows 터미널 한글/이모지 깨짐 방지
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# 파이어베이스 연동 (스크립트 파일 위치 기준 절대 경로 설정)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIAL_PATH = os.path.join(SCRIPT_DIR, 'firebase-key.json')
if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIAL_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

EXCEL_PATH = r"C:\Users\이민후\OneDrive - 주식회사 광장건설\_주_광장건설 정비 PJ - 10.정비PJ 송파문정 28번지일대\토지조서 총괄.xlsx"

print("엑셀 파일을 읽는 중입니다...")
df = pd.read_excel(EXCEL_PATH, sheet_name='통합', header=3)
df.columns = df.columns.str.replace(' ', '').str.replace('\n', '')

# ★ 범인 검거 2: 성명, 연락처에 남아있던 ffill() (윗줄 복사) 기능을 모조리 삭제했습니다!
df = df.fillna("")

private_area_col = next((col for col in df.columns if '전유면적' in col or '전용면적' in col), None)

def format_contact(val):
    if pd.isna(val) or str(val).strip() == "" or str(val).lower() == 'nan': return ""
    lines = str(val).split('\n')
    result_lines = []
    
    for line in lines:
        s = line.strip()
        if s.endswith('.0'): s = s[:-2]
        
        memo_match = re.search(r'\((.*?)\)', s)
        memo = f"({memo_match.group(1)})" if memo_match else ""
        
        num_only = re.sub(r'[^0-9]', '', s)
        
        if not num_only:
            if s: result_lines.append(s)
            continue
            
        if len(num_only) == 10 and num_only.startswith('10'):
            num_only = '0' + num_only
            
        formatted_num = num_only
        if len(num_only) == 11:
            formatted_num = f"{num_only[:3]}-{num_only[3:7]}-{num_only[7:]}"
        elif len(num_only) == 10:
            if num_only.startswith('02'): formatted_num = f"{num_only[:2]}-{num_only[2:6]}-{num_only[6:]}"
            else: formatted_num = f"{num_only[:3]}-{num_only[3:6]}-{num_only[6:]}"
            
        if memo: result_lines.append(f"{formatted_num} {memo}")
        else: result_lines.append(formatted_num)
        
    return '\n'.join(result_lines)

def merge_excel_to_firebase(dataframe):
    print("\n🔥 파이어베이스 잘못된 연락처/주소 강제 세탁 작업을 시작합니다...")
    success_count = 0
    grouped = dataframe.groupby('연번')

    for sn_val, group in grouped:
        sn_str = str(sn_val).replace('.0', '').strip()
        
        if not sn_str.isdigit():
            continue
            
        doc_id = str(int(float(sn_val)))
        
        try:
            def safe_float(val):
                try: return float(str(val).replace(',', '').replace('㎡', '').strip())
                except: return 0.0
            
            addr_list = []
            total_area, total_private, total_asset = 0.0, 0.0, 0
            
            for _, r in group.iterrows():
                main_num = str(r.get('본번', '')).split('.')[0]
                sub_num = str(r.get('부번', '')).split('.')[0]
                jibun = f"{main_num}-{sub_num}" if sub_num and sub_num not in ['0', 'nan'] else main_num
                
                bldg = str(r.get('건물명', '')).strip()
                ho = str(r.get('호수', '')).replace('.0', '').strip()
                
                if ho in ['0', 'nan', 'None', '', 'null', '0호', 'nan호']:
                    ho = ""
                elif ho and not ho.endswith('호'):
                    ho += '호'
                
                addr_str = f"문정동 {jibun}"
                if bldg and bldg != 'nan': addr_str += f" {bldg}"
                if ho: addr_str += f" {ho}"
                
                if addr_str not in addr_list:
                    addr_list.append(addr_str)
                    
                total_area += safe_float(r.get('편입면적', 0))
                total_private += safe_float(r.get(private_area_col, 0)) if private_area_col else 0
                total_asset += int(safe_float(r.get('종전추정가액', 0)))

            final_addr = ", ".join(addr_list)
            
            first_row = group.iloc[0]
            nm_val = str(first_row['성명']).strip()
            contact_val = format_contact(first_row.get('연락처', ''))
            
            update_data = {
                'nm': nm_val,
                'addr': final_addr,
                'tp': str(first_row.get('주용도4', '')).strip(),
                'residing': True if str(first_row.get('거주중', '')).strip() == 'O' else False,
                'age': str(first_row.get('연령', '')).strip(),
                # ★ 핵심: 엑셀이 빈칸이면 파이어베이스 데이터도 빈칸으로 '강제 덮어쓰기' 합니다.
                'contact': contact_val if contact_val else ""
            }
            
            if total_area > 0: update_data['area'] = round(total_area, 2)
            if total_private > 0: update_data['privateArea'] = round(total_private, 2)
            if total_asset > 0: update_data['asset'] = total_asset

            doc_ref = db.collection('owners').document(doc_id)
            doc_ref.set(update_data, merge=True)
            
            success_count += 1
            
        except Exception as e:
            print(f"[실패] 연번 {doc_id} 오류: {e}")

    print("-" * 40)
    print(f"✅ 동기화 완료: 성공 {success_count}건")

if __name__ == "__main__":
    merge_excel_to_firebase(df)