import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import numpy as np

# 파이어베이스 연동
CREDENTIAL_PATH = './firebase-key.json'
if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIAL_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

EXCEL_PATH = r"C:\Users\이민후\OneDrive - 주식회사 광장건설\_주_광장건설 정비 PJ - 송파구 문정동 28-1번지 일원\문정동28-1 토지조서.xlsx"

print("엑셀 파일을 읽는 중입니다...")
df = pd.read_excel(EXCEL_PATH, sheet_name='통합', header=3)
df.columns = df.columns.str.replace(' ', '').str.replace('\n', '')

# ★ 1번 기능 핵심: 엑셀 병합 셀 해제 및 빈칸을 위쪽 값으로 채움 (ffill)
df['연번'] = df['연번'].ffill()
df['성명'] = df['성명'].ffill()
if '연락처' in df.columns:
    df['연락처'] = df['연락처'].ffill()

df = df.fillna("")

private_area_col = next((col for col in df.columns if '전유면적' in col or '전용면적' in col), None)

def format_contact(val):
    if pd.isna(val) or str(val).strip() == "" or str(val).lower() == 'nan': return ""
    s = str(val).strip()
    if s.endswith('.0'): s = s[:-2]
    if s.isdigit():
        if len(s) == 10 and s.startswith('10'): s = '0' + s
        if len(s) == 11: s = f"{s[:3]}-{s[3:7]}-{s[7:]}"
    return s

def merge_excel_to_firebase(dataframe):
    print("\n파이어베이스 데이터 병합을 시작합니다...")
    success_count = 0

    # 연번(소유주)을 기준으로 데이터를 그룹화합니다.
    grouped = dataframe.groupby('연번')

    for sn_val, group in grouped:
        sn_str = str(sn_val).replace('.0', '').strip()
        # ★ '조합원' 같은 글자나 빈칸이 들어오면 에러 없이 부드럽게 건너뜁니다.
        if not sn_str.isdigit():
            continue
            
        doc_id = str(int(float(sn_val)))
        
        try:
            def safe_float(val):
                try: return float(str(val).replace(',', '').replace('㎡', '').strip())
                except: return 0.0
            
            addr_list = []
            total_area, total_private, total_asset = 0.0, 0.0, 0
            
            # 해당 소유주가 가진 '모든 물건지'를 반복하며 주소와 면적을 합칩니다.
            for _, r in group.iterrows():
                main_num = str(r.get('본번', '')).split('.')[0]
                sub_num = str(r.get('부번', '')).split('.')[0]
                jibun = f"{main_num}-{sub_num}" if sub_num and sub_num not in ['0', 'nan'] else main_num
                
                bldg = str(r.get('건물명', '')).strip()
                ho = str(r.get('호수', '')).replace('.0', '').strip()
                
                addr_str = f"문정동 {jibun}"
                if bldg and bldg != 'nan': addr_str += f" {bldg}"
                if ho and ho != 'nan': addr_str += f" {ho}"
                
                if addr_str not in addr_list:
                    addr_list.append(addr_str)
                    
                total_area += safe_float(r.get('편입면적', 0))
                total_private += safe_float(r.get(private_area_col, 0)) if private_area_col else 0
                total_asset += int(safe_float(r.get('종전추정가액', 0)))

            # 주소들을 쉼표(,)로 예쁘게 연결합니다. (예: 문정동 28-1 401호, 문정동 28-1 402호)
            final_addr = ", ".join(addr_list)
            
            first_row = group.iloc[0]
            nm_val = str(first_row['성명']).strip()
            contact_val = format_contact(first_row.get('연락처', ''))
            
            update_data = {
                'nm': nm_val,
                'addr': final_addr, 
                'tp': str(first_row.get('주용도4', '')).strip(),
                'residing': True if str(first_row.get('거주중', '')).strip() == 'O' else False,
                'age': str(first_row.get('연령', '')).strip()
            }
            
            if contact_val: update_data['contact'] = contact_val
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