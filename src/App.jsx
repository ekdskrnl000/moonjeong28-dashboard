import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { db } from './firebase'; //
import { collection, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

// --- 1. 소유자 데이터 (데이터가 너무 길어 1~100번 전체가 있다고 가정하고 진행합니다) ---
const RAW_OWNERS = [
  {"id":1,"sn":1,"nm":"광주이씨광천군파문정총회","addr":"문정동 28","tp":"제2종근린생활시설","cat":"상가/기타","area":233.3,"asset":2838168160,"rights":4319408122,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 가락동 120-1","residing":false,"items":1},
  // ... (이곳에 이전에 사용하시던 2번부터 100번까지의 데이터를 모두 넣어주세요)
  {"id":100,"sn":100,"nm":"박활성외2","addr":"문정동 28-36 외 1건","tp":"단독주택","cat":"단독/다가구","area":208.8,"asset":2612076480,"rights":3975319194,"agreed":false,"age":"50대","fullAddr":"서울특별시 강동구 올림픽로112길 17","residing":false,"items":2}
];

// --- 2. 지적도 및 물리적 상수 설정 (기존과 동일) ---
const RATIO = 152.19; 
const PRICE_46 = 866277500; const PRICE_59 = 1135557500; const PRICE_84 = 1539477500;
const AREA_46 = 18.53; const AREA_59 = 24.29; const AREA_84 = 32.93;

const fmt = (n) => {
  if (n === undefined || isNaN(n)) return "0원";
  const neg = n < 0; const a = Math.abs(Math.round(n));
  const eok = Math.floor(a / 1e8); const man = Math.floor((a % 1e8) / 1e4);
  let r = neg ? "-" : ""; if (eok > 0) r += `${eok}억`; if (man > 0) r += ` ${man.toLocaleString()}만`;
  return (r || "0") + "원";
};
const fmtNum = (n) => Math.round(n).toLocaleString();

const extractUnit = (addr, cat) => {
  if (cat !== "공동주택") return "";
  const match = addr.match(/([0-9a-zA-Z가-힣]+호)/);
  return match ? match[1] : "";
};

// --- 3. 아이콘 컴포넌트 ---
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
);
const IconHome = (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />;
const IconUsers = (p) => <Icon {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M16 3.13a4 4 0 0 1 0 7.75" />;
const IconChart = (p) => <Icon {...p} d="M18 20V10 M12 20V4 M6 20v-6" />;
const IconBack = (p) => <Icon {...p} d="M19 12H5 M12 19l-7-7 7-7" />;
const IconSearch = (p) => <Icon {...p} d="M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z M16 16l4.5 4.5" />;
const IconMap = (p) => <Icon {...p} d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16" />;
const IconLock = (p) => <Icon {...p} d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4" />;

const AUTHORIZED_USERS = [
  { id: "u1", name: "최희현", role: "부회장", pin: "1001" },
  { id: "master", name: "시스템", role: "관리자", pin: "5162" }
];

// --- 4. 메인 App 컴포넌트 ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [owners, setOwners] = useState([]);
  const [view, setView] = useState("dash"); 
  const [selectedId, setSelectedId] = useState(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [catTab, setCatTab] = useState("공동주택");

  // 파이어베이스 실시간 데이터 연동
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "owners"), (snapshot) => {
      const ownerData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (ownerData.length === 0) {
        setOwners(RAW_OWNERS.map(o => ({ ...o, memoHistory: [], disposition: "", agreedBy: "" })));
      } else {
        setOwners(ownerData.sort((a, b) => Number(a.sn) - Number(b.sn)));
      }
    });
    return () => unsubscribe();
  }, []);

  // 데이터 업데이트 시 파이어베이스 저장
  const updateOwner = useCallback(async (id, updates) => {
    try {
      setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      const ownerRef = doc(db, "owners", String(id));
      await updateDoc(ownerRef, updates);
    } catch (error) {
      console.error("저장 실패:", error);
    }
  }, []);

  // 초기 데이터 업로드 버튼용 함수
  const syncInitialData = async () => {
    if (!window.confirm("데이터베이스를 초기 데이터(100명)로 채우시겠습니까?")) return;
    const batch = writeBatch(db);
    RAW_OWNERS.forEach(o => {
      const docRef = doc(db, "owners", String(o.id));
      batch.set(docRef, { ...o, memoHistory: [], disposition: "", agreedBy: "" });
    });
    await batch.commit();
    alert("완료되었습니다!");
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  // (이 아래로 Dashboard, ListView, DetailView 등 모든 UI 컴포넌트들을 차례대로 추가하세요)
  return (
    <div style={{ background: "#0C0C0E", color: "#fff", minHeight: "100vh" }}>
      {/* 기존 대시보드 UI를 이곳에 그대로 구성 */}
      <header style={{ padding: 16, display: "flex", justifyContent: "space-between" }}>
         <h1>문정동 28번지 스마트 대시보드</h1>
         <button onClick={syncInitialData} style={{ opacity: 0.2, fontSize: 10 }}>DB 동기화</button>
      </header>
      {/* (생략된 기존 UI 렌더링 코드들...) */}
    </div>
  );
}

// (나머지 LoginScreen, Dashboard, StatCard, ListView 등 함수들도 이 파일 아래에 모두 포함되어야 합니다)