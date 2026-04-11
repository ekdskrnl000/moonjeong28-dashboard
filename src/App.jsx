import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
// 파이어베이스 설정 불러오기
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, writeBatch } from "firebase/firestore";

// --- 기존의 100명 RAW_OWNERS 데이터는 그대로 유지합니다 ---
const RAW_OWNERS = [
  {"id":1,"sn":1,"nm":"광주이씨광천군파문정총회","addr":"문정동 28","tp":"제2종근린생활시설","cat":"상가/기타","area":233.3,"asset":2838168160,"rights":4319408122,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 가락동 120-1","residing":false,"items":1},
  // ... (나머지 2번부터 100번까지의 데이터가 여기에 있다고 가정합니다. 직접 넣어주세요!)
  {"id":100,"sn":100,"nm":"박활성외2","addr":"문정동 28-36 외 1건","tp":"단독주택","cat":"단독/다가구","area":208.8,"asset":2612076480,"rights":3975319194,"agreed":false,"age":"50대","fullAddr":"서울특별시 강동구 올림픽로112길 17","residing":false,"items":2}
];

// ... (기존의 RATIO, PRICE_46, fmt, fmtNum, Icons 등 모든 상수와 컴포넌트들은 그대로 유지)

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [owners, setOwners] = useState([]); // 초기값은 빈 배열
  const [view, setView] = useState("dash"); 
  const [selectedId, setSelectedId] = useState(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [catTab, setCatTab] = useState("공동주택");

  // --- [추가] 파이어베이스 실시간 연동 로직 ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "owners"), (snapshot) => {
      const ownerData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      if (ownerData.length === 0) {
        // DB가 비었을 때만 로컬 데이터를 보여줌
        setOwners(RAW_OWNERS.map(o => ({ ...o, memoHistory: [], disposition: "", agreedBy: "" })));
      } else {
        // DB 데이터를 번호순(sn)으로 정렬하여 표시
        setOwners(ownerData.sort((a, b) => Number(a.sn) - Number(b.sn)));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- [추가] 초기 데이터 업로드 함수 (마스터 전용) ---
  const syncInitialData = async () => {
    if (!window.confirm("기존 100명의 데이터를 파이어베이스에 업로드하시겠습니까?")) return;
    try {
      const batch = writeBatch(db);
      RAW_OWNERS.forEach((owner) => {
        const docRef = doc(db, "owners", String(owner.id));
        batch.set(docRef, { ...owner, memoHistory: [], disposition: "", agreedBy: "" });
      });
      await batch.commit();
      alert("성공! 이제 새로고침해도 데이터가 유지됩니다.");
    } catch (e) {
      console.error(e);
      alert("업로드 실패. 콘솔을 확인하세요.");
    }
  };

  // --- [수정] 데이터 수정 시 파이어베이스 반영 ---
  const updateOwner = useCallback(async (id, updates) => {
    try {
      // 화면 먼저 업데이트
      setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      // 서버 업데이트
      const ownerRef = doc(db, "owners", String(id));
      await updateDoc(ownerRef, updates);
    } catch (error) {
      console.error("저장 실패:", error);
    }
  }, []);

  // ... (이하 기존 렌더링 UI 로직은 이전과 동일하게 유지)
  // 팁: 헤더나 로그인 화면 근처에 <button onClick={syncInitialData}>데이터 초기화</button>를 하나 만들어두면 편합니다.
}