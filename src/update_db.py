import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore

# 1. 파이어베이스 연동
CREDENTIAL_PATH = './firebase-key.json'
if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIAL_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

EXCEL_PATH = r"C:\Users\이민후\OneDrive - 주식회사 광장건설\_주_광장건설 정비 PJ - 송파구 문정동 28-1번지 일원\문정동28-1 토지조서.xlsx"

print("엑셀 파일을 읽는 중입니다...")
df = pd.read_excel(EXCEL_PATH, sheet_name='통합', header=3)
df.columns = df.columns.str.replace(' ', '').str.replace('\n', '')
df = df.fillna("")

# 전유면적 열 찾기
private_area_col = None
for col in df.columns:
    if '전유면적' in col or '전용면적' in col:
        private_area_col = col
        break

print(f"-> 💡 감지된 전유면적 엑셀 열 이름: '{private_area_col}'")

# ★ 추가된 기능: 연락처 자동 보정 (하이픈 삽입 및 0 누락 방지)
def format_contact(val):
    if pd.isna(val) or str(val).strip() == "" or str(val).lower() == 'nan':
        return ""
    s = str(val).strip()
    if s.endswith('.0'): 
        s = s[:-2]
    if s.isdigit():
        if len(s) == 10 and s.startswith('10'):
            s = '0' + s
        if len(s) == 11:
            s = f"{s[:3]}-{s[3:7]}-{s[7:]}"
    return s

def merge_excel_to_firebase(dataframe):
    print("\n파이어베이스 데이터 병합을 시작합니다...")
    success_count = 0

    for index, row in dataframe.iterrows():
        if row['연번'] == "" or not str(row['연번']).replace('.0', '').isdigit():
            continue

        doc_id = str(int(float(row['연번'])))

        try:
            def safe_float(val):
                try:
                    return float(str(val).replace(',', '').replace('㎡', '').strip())
                except:
                    return 0.0
            
            nm_val = str(row['성명']).strip()
            area_val = safe_float(row['편입면적']) if '편입면적' in dataframe.columns else 0.0
            private_area_val = safe_float(row[private_area_col]) if private_area_col else 0.0
            asset_val = int(safe_float(row['종전추정가액'])) if '종전추정가액' in dataframe.columns else 0
            
            # ★ 추가된 기능: 엑셀에서 연락처(AP열) 가져와서 예쁘게 만들기
            contact_val = format_contact(row.get('연락처', ''))

            update_data = {
                'nm': nm_val,
                'tp': str(row['주용도4']).strip() if '주용도4' in dataframe.columns else "",
                'residing': True if str(row['거주중']).strip() == 'O' else False,
                'age': str(row['연령']).strip() if '연령' in dataframe.columns else "",
            }
            
            # 연락처 데이터가 존재할 때만 업데이트
            if contact_val:
                update_data['contact'] = contact_val

            # 면적이나 가액이 0보다 클 때만 업데이트
            if area_val > 0:
                update_data['area'] = area_val
            if private_area_val > 0:
                update_data['privateArea'] = private_area_val
            if asset_val > 0:
                update_data['asset'] = asset_val

            doc_ref = db.collection('owners').document(doc_id)
            doc_ref.set(update_data, merge=True)
            
            success_count += 1
            
        except Exception as e:
            print(f"[실패] 연번 {doc_id} 오류: {e}")

    print("-" * 40)
    print(f"✅ 동기화 작업 완료: 성공 {success_count}건")

if __name__ == "__main__":
    merge_excel_to_firebase(df)