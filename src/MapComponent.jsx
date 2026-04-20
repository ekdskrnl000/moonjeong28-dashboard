import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 37.4898, lng: 127.1255 };

const OWNER_LOTS = {1:["28"],2:["28-1","28-34"],3:["28-1"],4:["28-1"],5:["28-1"],6:["28-1"],7:["28-1"],8:["28-1"],9:["28-1"],10:["28-1"],11:["28-2"],12:["28-2"],13:["28-2"],14:["28-2"],15:["28-2"],16:["28-2"],17:["28-2"],18:["28-2"],19:["28-2"],20:["28-3"],21:["28-3"],22:["28-3"],23:["28-3"],24:["28-3"],25:["28-3"],26:["28-3"],27:["28-3"],28:["28-4"],29:["28-5"],30:["28-5"],31:["28-5"],32:["28-5"],33:["28-5"],34:["28-5"],35:["28-5"],36:["28-5"],37:["28-6"],38:["28-6"],39:["28-6"],40:["28-6"],41:["28-6"],42:["28-6"],43:["28-6"],44:["28-6"],45:["28-6"],46:["28-6"],47:["28-6"],48:["28-7"],49:["28-8"],50:["28-10"],51:["28-11"],52:["28-11"],53:["28-11"],54:["28-11"],55:["28-11"],56:["28-11"],57:["28-11"],58:["28-11"],59:["28-12"],60:["28-13"],61:["28-14"],62:["28-15"],63:["28-15"],64:["28-15"],65:["28-15"],66:["28-15"],67:["28-15"],68:["28-15"],69:["28-15"],70:["28-15"],71:["28-17"],72:["28-18"],73:["28-19"],74:["28-21"],75:["28-21"],76:["28-21"],77:["28-21"],78:["28-21"],79:["28-21"],80:["28-21"],81:["28-21"],82:["28-21"],83:["28-21"],84:["28-21"],85:["28-21"],86:["28-23"],87:["28-24"],88:["28-26"],89:["28-27"],90:["28-28"],91:["28-29"],92:["28-31"],93:["28-32"],94:["28-32"],95:["28-32"],96:["28-32"],97:["28-32"],98:["28-32"],99:["28-35"],100:["28-36"]};

const TEXT_SHIFT_X = 25;  
const TEXT_SHIFT_Y = 5;

const extractDisplayName = (jibun, ownersInLot) => {
  let displayName = jibun;
  if (ownersInLot.length > 0 && ownersInLot[0].addr) {
    const parts = ownersInLot[0].addr.split(" ");
    if (parts.length >= 3) {
      let bldg = parts[2];
      if (!bldg.includes("호") && bldg !== "외" && isNaN(bldg[0])) {
        bldg = bldg.replace(/빌라|빌/g, "");
        displayName = bldg.startsWith("다세대") ? jibun + "다세대" : bldg;
      }
    }
  }
  return displayName;
};

const MapComponent = ({ owners = [], mapFilter = "전체", onSelectOwner }) => {
  const mapRef = useRef(null);
  const [mapTypeId, setMapTypeId] = useState('roadmap'); 
  const [infoWindowData, setInfoWindowData] = useState(null);
  const [lotCenters, setLotCenters] = useState([]);
  
  // ★ 왼쪽 상단에 띄울 자체 필터 상태 (동의상태 & 용도별)
  const [statusFilter, setStatusFilter] = useState("전체");
  const [catFilter, setCatFilter] = useState("전체");

  // App에서 넘어온 필터가 바뀌면 연동
  useEffect(() => { setStatusFilter(mapFilter); }, [mapFilter]);
  
  const ownersRef = useRef(owners);
  useEffect(() => { ownersRef.current = owners; }, [owners]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDbSk9yYasaQU3m7V43skw2Bv-BtH2Esxw" 
  });

  const applyStyle = useCallback((mapInstance) => {
    mapInstance.data.setStyle((feature) => {
      if (feature.getGeometry().getType() === 'Point') return { visible: false };

      const layerName = feature.getProperty('layer');
      if (layerName === '사업지') return { strokeColor: '#FF2A55', strokeWeight: 3, fillOpacity: 0, clickable: false };

      const rawLabel = feature.getProperty('label') || "";
      const jibun = rawLabel.replace(/[대도]/g, '').trim();
      const ownersInLot = ownersRef.current.filter(o => (OWNER_LOTS[o.sn] || []).includes(jibun));
      
      const totalCount = ownersInLot.length;
      const agreedCount = ownersInLot.filter(o => o.agreed).length;
      const isSelected = infoWindowData && infoWindowData.jibun === jibun;

      const counts = {};
      ownersInLot.forEach(o => { counts[o.cat] = (counts[o.cat] || 0) + 1; });
      const primaryCat = Object.keys(counts).length > 0 
        ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) 
        : "기타";

      let fillColor = '#3A3A40'; 
      let fillOpacity = 0.35; 
      
      if (totalCount > 0) {
        if (agreedCount === totalCount) { fillColor = '#22C55E'; }
        else if (agreedCount > 0) { fillColor = '#EAB308'; }
        else { fillColor = '#EF4444'; }
      }

      // ★ 필터 로직: 상태와 용도를 모두 검사합니다.
      let isStatusMatch = true;
      if (statusFilter === "동의완료" && agreedCount !== totalCount) isStatusMatch = false;
      if (statusFilter === "미동의" && (totalCount === 0 || agreedCount > 0)) isStatusMatch = false;
      if (statusFilter === "부분동의" && (agreedCount === 0 || agreedCount === totalCount)) isStatusMatch = false;

      let isCatMatch = true;
      if (catFilter !== "전체") {
        if (catFilter === "상가/기타" && primaryCat !== "상가/기타" && primaryCat !== "기타") isCatMatch = false;
        if (catFilter !== "상가/기타" && primaryCat !== catFilter) isCatMatch = false;
      }

      let isVisible = isStatusMatch && isCatMatch;
      
      // 필터에 안 맞으면 투명하게 감춤
      if (!isVisible) {
        fillOpacity = 0.05;
      }

      let finalStrokeWeight = isSelected ? 4 : 1;
      let finalStrokeColor = isSelected ? '#FFFFFF' : '#FFFFFF';
      let finalStrokeOpacity = isSelected ? 1.0 : (isVisible ? 0.4 : 0.1);
      
      if (isSelected && isVisible) {
        fillColor = '#3B82F6'; 
        fillOpacity = 0.7;
      }

      return { strokeColor: finalStrokeColor, strokeWeight: finalStrokeWeight, strokeOpacity: finalStrokeOpacity, fillColor, fillOpacity, zIndex: isSelected ? 100 : 1, title: jibun };
    });
  }, [statusFilter, catFilter, infoWindowData]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    
    fetch('/moonjeong28_map_3point.geojson')
      .then(res => res.json())
      .then(data => {
        map.data.forEach((feature) => map.data.remove(feature));
        map.data.addGeoJson(data);

        const centers = [];
        data.features.forEach(f => {
          if (f.geometry.type === 'Point') {
            const cleanJibun = f.properties.label.replace(/[대도]/g, '').trim();
            centers.push({ jibun: cleanJibun, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
          }
        });
        setLotCenters(centers);
        applyStyle(map); 
      })
      .catch(err => console.error("도면 로드 실패:", err));

    map.addListener('click', () => setInfoWindowData(null));

    window.google.maps.event.clearListeners(map.data, 'click');
    map.data.addListener('click', (event) => {
      const layerName = event.feature.getProperty('layer');
      if (layerName === '사업지') return; 

      const rawLabel = event.feature.getProperty('label');
      if (!rawLabel) return;
      const jibun = rawLabel.replace(/[대도]/g, '').trim();
      const ownersInLot = ownersRef.current.filter(o => (OWNER_LOTS[o.sn] || []).includes(jibun));
      const displayName = extractDisplayName(jibun, ownersInLot);
      
      setInfoWindowData({ position: { lat: event.latLng.lat(), lng: event.latLng.lng() }, jibun, displayName, ownersInLot });
    });
  }, [applyStyle]);

  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  useEffect(() => { if (mapRef.current) applyStyle(mapRef.current); }, [owners, statusFilter, catFilter, infoWindowData, applyStyle]);

  if (!isLoaded) return <div style={{ color: 'white', padding: '20px' }}>구글 지도 로딩중... 기다려주세요!</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        @keyframes mapPulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes popupSlideUp {
          0% { opacity: 0; transform: translate(-50%, -85%) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        .filter-btn {
          padding: 6px 12px; border-radius: 6px; border: none; font-weight: 700; font-size: 11px; cursor: pointer; color: #9CA3AF; background: transparent; transition: all 0.2s; white-space: nowrap;
        }
        .filter-btn.active {
          color: #FFF; background: #FF2A55;
        }
        .filter-btn.active-cat {
          color: #FFF; background: #3B82F6;
        }
      `}</style>

      {/* ★ 1. 좌측 상단: 동의 상태 & 용도 필터 UI 복원! */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#161618', padding: '4px', borderRadius: '8px', border: '1px solid #2A2A2E', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflowX: 'auto' }}>
          {["전체", "동의완료", "부분동의", "미동의"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`filter-btn ${statusFilter === f ? 'active' : ''}`}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#161618', padding: '4px', borderRadius: '8px', border: '1px solid #2A2A2E', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflowX: 'auto' }}>
          {["전체", "단독/다가구", "공동주택", "상가/기타"].map(c => {
            const label = c === "전체" ? "모든 용도" : c === "단독/다가구" ? "🏠 단독" : c === "공동주택" ? "🏢 공동" : "🏪 기타";
            return (
              <button key={c} onClick={() => setCatFilter(c)} className={`filter-btn ${catFilter === c ? 'active-cat' : ''}`}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* 우측 상단: 위성/일반 토글 */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '8px', background: '#161618', padding: '6px', borderRadius: '8px', border: '1px solid #2A2A2E', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <button onClick={() => setMapTypeId('roadmap')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer', background: mapTypeId === 'roadmap' ? '#FF2A55' : 'transparent', color: mapTypeId === 'roadmap' ? '#FFF' : '#9CA3AF' }}>일반</button>
        <button onClick={() => setMapTypeId('satellite')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer', background: mapTypeId === 'satellite' ? '#FF2A55' : 'transparent', color: mapTypeId === 'satellite' ? '#FFF' : '#9CA3AF' }}>위성</button>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={19} mapTypeId={mapTypeId} onLoad={onLoad} onUnmount={onUnmount} options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false, gestureHandling: 'greedy' }}>
        {lotCenters.map((lot) => {
          const ownersInLot = owners.filter(o => (OWNER_LOTS[o.sn] || []).includes(lot.jibun));
          const totalCount = ownersInLot.length;
          const agreedCount = ownersInLot.filter(o => o.agreed).length;
          const isSelected = infoWindowData && infoWindowData.jibun === lot.jibun;
          
          if (totalCount === 0) return null;

          const counts = {};
          ownersInLot.forEach(o => { counts[o.cat] = (counts[o.cat] || 0) + 1; });
          const primaryCat = Object.keys(counts).length > 0 
            ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) 
            : "상가/기타";

          // ★ 필터에 안 맞으면 아이콘도 숨김 처리
          let isStatusMatch = true;
          if (statusFilter === "동의완료" && agreedCount !== totalCount) isStatusMatch = false;
          if (statusFilter === "미동의" && agreedCount > 0) isStatusMatch = false;
          if (statusFilter === "부분동의" && (agreedCount === 0 || agreedCount === totalCount)) isStatusMatch = false;

          let isCatMatch = true;
          if (catFilter !== "전체") {
            if (catFilter === "상가/기타" && primaryCat !== "상가/기타" && primaryCat !== "기타") isCatMatch = false;
            if (catFilter !== "상가/기타" && primaryCat !== catFilter) isCatMatch = false;
          }

          if (!isStatusMatch || !isCatMatch) return null; // 화면에서 지워버림

          let boxColor = '#991B1B'; 
          if (primaryCat === "공동주택") boxColor = '#854D0E'; 
          else if (primaryCat === "상가/기타" || primaryCat === "기타") boxColor = '#1E3A8A'; 

          return (
            <OverlayView key={lot.jibun} position={{ lat: lot.lat, lng: lot.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoWindowData({ position: { lat: lot.lat, lng: lot.lng }, jibun: lot.jibun, displayName: extractDisplayName(lot.jibun, ownersInLot), ownersInLot });
                }}
                style={{ 
                  transform: `translate(calc(-50% + ${TEXT_SHIFT_X}px), calc(-50% + ${TEXT_SHIFT_Y}px))`, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', pointerEvents: 'auto',
                  zIndex: isSelected ? 100 : 1
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '800', color: '#FFF', textShadow: '0px 1px 3px rgba(0,0,0,0.9)', marginBottom: '4px' }}>{lot.jibun}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))', animation: isSelected ? 'mapPulseGlow 1.5s infinite' : 'none', borderRadius: '4px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24">
                    {primaryCat === "단독/다가구" && <g><rect x="4" y="10" width="16" height="12" rx="1" fill={boxColor} stroke="#fff" strokeWidth="1.5" /><polygon points="2,10 12,2 22,10" fill={boxColor} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></g>}
                    {primaryCat === "공동주택" && <g><rect x="4" y="4" width="16" height="18" rx="2" fill={boxColor} stroke="#fff" strokeWidth="1.5" /><rect x="8" y="8" width="3" height="3" fill="#fff" rx="0.5" /><rect x="13" y="8" width="3" height="3" fill="#fff" rx="0.5" /><rect x="8" y="14" width="3" height="3" fill="#fff" rx="0.5" /><rect x="13" y="14" width="3" height="3" fill="#fff" rx="0.5" /></g>}
                    {(primaryCat === "상가/기타" || primaryCat === "기타") && <g><rect x="3" y="10" width="18" height="12" rx="1" fill={boxColor} stroke="#fff" strokeWidth="1.5" /><polygon points="2,10 4,4 20,4 22,10" fill={boxColor} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /><line x1="8" y1="10" x2="8" y2="15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /><line x1="16" y1="10" x2="16" y2="15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></g>}
                  </svg>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFF', marginTop: '2px', background: boxColor, padding: '0px 4px', borderRadius: '4px', border: '1px solid #fff' }}>{agreedCount}/{totalCount}</span>
                </div>
              </div>
            </OverlayView>
          );
        })}

        {infoWindowData && (
          <OverlayView position={infoWindowData.position} mapPaneName={OverlayView.FLOAT_PANE}>
            <div style={{ position: "absolute", left: "50%", transform: `translate(-50%, -100%)`, marginTop: `-20px`, background: "#fff", color: "#111", borderRadius: "16px", padding: "20px", width: "280px", maxWidth: "85vw", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", pointerEvents: "auto", cursor: "default", animation: 'popupSlideUp 0.3s ease-out forwards', zIndex: 999 }}>
              <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #fff" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}>문정동 {infoWindowData.jibun}</h3>
                  <div style={{ display: "inline-block", background: "#FFE4E6", color: "#E11D48", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", marginTop: "8px" }}>동의 {infoWindowData.ownersInLot.filter(o => o.agreed).length}/{infoWindowData.ownersInLot.length}명</div>
                </div>
                <button onClick={() => setInfoWindowData(null)} style={{ background: "none", border: "none", fontSize: "20px", fontWeight: "700", color: "#9CA3AF", cursor: "pointer", padding: 0 }}>✕</button>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0 0", maxHeight: "250px", overflowY: "auto" }}>
                {infoWindowData.ownersInLot.map(o => {
                  const unitMatch = o.addr.match(/([0-9a-zA-Z가-힣]+호)/);
                  const unit = unitMatch ? unitMatch[1] : "";
                  return (
                    <li key={o.id} onClick={() => { setInfoWindowData(null); if (onSelectOwner) onSelectOwner(o.id); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #F3F4F6", cursor: "pointer" }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "#111" }}>{o.nm}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{unit && <span style={{ fontSize: "13px", fontWeight: "700", color: "#3B82F6" }}>{unit}</span>}<span style={{ fontSize: "11px", color: "#9CA3AF" }}>#{o.sn}</span></div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "800", padding: "4px 8px", borderRadius: "6px", background: o.agreed ? "#D1FAE5" : "#FFE4E6", color: o.agreed ? "#059669" : "#E11D48" }}>{o.agreed ? "동의" : "미동"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapComponent);