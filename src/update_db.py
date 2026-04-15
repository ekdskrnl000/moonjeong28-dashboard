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
            
            # [디버그용 화면 출력] 1번, 2번 소유주의 엑셀 원본 데이터를 터미널에 보여줍니다.
            if doc_id in ["1", "2"]:
                print(f"   [디버그 확인용] 연번 {doc_id} ({nm_val}) | 엑셀에서 찾은 전유면적 원본: '{row[private_area_col]}' -> 파이썬 인식: {private_area_val}")

            update_data = {
                'nm': nm_val,
                'tp': str(row['주용도4']).strip() if '주용도4' in dataframe.columns else "",
                'residing': True if str(row['거주중']).strip() == 'O' else False,
                'age': str(row['연령']).strip() if '연령' in dataframe.columns else ""
            }
            
            # [핵심 보호 로직] 면적이나 가액이 0보다 클 때만 업데이트합니다! (빈칸 덮어쓰기 완벽 방지)
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