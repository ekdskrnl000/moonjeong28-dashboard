import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
// 파이어베이스 도구 임포트
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

// ─── 소유자 데이터 (원본 그대로 유지) ─── [cite: 2-10]
const RAW_OWNERS = [
  {"id":1,"sn":1,"nm":"광주이씨광천군파문정총회","addr":"문정동 28","tp":"제2종근린생활시설","cat":"상가/기타","area":233.3,"asset":2838168160,"rights":4319408122,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 가락동 120-1","residing":false,"items":1},
  {"id":2,"sn":2,"nm":"이종학","addr":"문정동 28-1 청송하이츠빌B 101호 외 2건","tp":"근린생활시설","cat":"상가/기타","area":488.4,"asset":5879797500,"rights":8948463815,"agreed":false,"age":"70대","fullAddr":"서울 송파구 문정동 4-3","residing":false,"items":3},
  {"id":3,"sn":3,"nm":"송점아","addr":"문정동 28-1 청송하이츠빌B 201호","tp":"다세대","cat":"공동주택","area":35.71,"asset":552000000,"rights":840088800,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로8길 10, 201호","residing":true,"items":1},
  {"id":4,"sn":4,"nm":"배홍숙","addr":"문정동 28-1 청송하이츠빌B 202호","tp":"다세대","cat":"공동주택","area":35.71,"asset":552000000,"rights":840088800,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 가락동 103-10","residing":false,"items":1},
  {"id":5,"sn":5,"nm":"양명숙","addr":"문정동 28-1 청송하이츠빌B 301호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 문정동28-1 301호","residing":true,"items":1},
  {"id":6,"sn":6,"nm":"오우진","addr":"문정동 28-1 청송하이츠빌B 302호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 백제고분로27길","residing":false,"items":1},
  {"id":7,"sn":7,"nm":"이숙현","addr":"문정동 28-1 청송하이츠빌B 401호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로8길 10,401호","residing":true,"items":1},
  {"id":8,"sn":8,"nm":"김병기","addr":"문정동 28-1 청송하이츠빌B 402호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 문정동28-1 402호","residing":false,"items":1},
  {"id":9,"sn":9,"nm":"정행택","addr":"문정동 28-1 청송하이츠빌B 501호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로8길 6","residing":true,"items":1},
  {"id":10,"sn":10,"nm":"민경희","addr":"문정동 28-1 청송하이츠빌B 502호","tp":"다세대","cat":"공동주택","area":35.71,"asset":557000000,"rights":847698300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로8길 10, 502호","residing":true,"items":1},
  {"id":11,"sn":11,"nm":"김제각외1","addr":"문정동 28-2 청송하이츠빌 101호 외 1건","tp":"소매점","cat":"상가/기타","area":81.28,"asset":1253000000,"rights":1906940700,"agreed":false,"age":"60대","fullAddr":"경기도 용인시 수지구","residing":false,"items":2},
  {"id":12,"sn":12,"nm":"이지은","addr":"문정동 28-2 청송하이츠빌 201호","tp":"다세대","cat":"공동주택","area":34.05,"asset":539000000,"rights":820304100,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-2","residing":false,"items":1},
  {"id":13,"sn":13,"nm":"강재형","addr":"문정동 28-2 청송하이츠빌 202호","tp":"다세대","cat":"공동주택","area":34.05,"asset":539000000,"rights":820304100,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-2","residing":true,"items":1},
  {"id":14,"sn":14,"nm":"문주영외1","addr":"문정동 28-2 청송하이츠빌 301호","tp":"다세대","cat":"공동주택","area":34.05,"asset":544000000,"rights":827913600,"agreed":false,"age":"40대","fullAddr":"문정로55","residing":true,"items":1},
  {"id":15,"sn":15,"nm":"서용숙","addr":"문정동 28-2 청송하이츠빌 302호","tp":"다세대","cat":"공동주택","area":34.05,"asset":544000000,"rights":827913600,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 문정동 28-2","residing":true,"items":1},
  {"id":16,"sn":16,"nm":"변철종","addr":"문정동 28-2 청송하이츠빌 401호","tp":"다세대","cat":"공동주택","area":34.05,"asset":544000000,"rights":827913600,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로8길 6","residing":false,"items":1},
  {"id":17,"sn":17,"nm":"김인순","addr":"문정동 28-2 청송하이츠빌 402호","tp":"다세대","cat":"공동주택","area":34.02,"asset":544000000,"rights":827913600,"agreed":false,"age":"80대 이상","fullAddr":"경기도 남양주시","residing":false,"items":1},
  {"id":18,"sn":18,"nm":"공성동외1","addr":"문정동 28-2 청송하이츠빌 501호","tp":"다세대","cat":"공동주택","area":34.05,"asset":544000000,"rights":827913600,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 오금로42길10","residing":false,"items":1},
  {"id":19,"sn":19,"nm":"정금자","addr":"문정동 28-2 청송하이츠빌 502호","tp":"다세대","cat":"공동주택","area":34.05,"asset":544000000,"rights":827913600,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 동남로8길6","residing":true,"items":1},
  {"id":20,"sn":20,"nm":"민경애","addr":"문정동 28-3 양지빌라 201호","tp":"다세대","cat":"공동주택","area":29.0,"asset":452000000,"rights":687898800,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 동남로6길 3-22, 201호","residing":true,"items":1},
  {"id":21,"sn":21,"nm":"배진선","addr":"문정동 28-3 양지빌라 202호","tp":"다세대","cat":"공동주택","area":29.0,"asset":452000000,"rights":687898800,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 새말로12길 9","residing":false,"items":1},
  {"id":22,"sn":22,"nm":"김강수","addr":"문정동 28-3 양지빌라 301호","tp":"다세대","cat":"공동주택","area":29.0,"asset":457000000,"rights":695508300,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 송이로31길 12-6","residing":false,"items":1},
  {"id":23,"sn":23,"nm":"임명숙","addr":"문정동 28-3 양지빌라 302호","tp":"다세대","cat":"공동주택","area":29.0,"asset":457000000,"rights":695508300,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 새말로17길 16-15","residing":false,"items":1},
  {"id":24,"sn":24,"nm":"김은곤","addr":"문정동 28-3 양지빌라 401호","tp":"다세대","cat":"공동주택","area":29.0,"asset":457000000,"rights":695508300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로11길 26-13","residing":false,"items":1},
  {"id":25,"sn":25,"nm":"류지연","addr":"문정동 28-3 양지빌라 402호","tp":"다세대","cat":"공동주택","area":29.0,"asset":457000000,"rights":695508300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로8길 21","residing":false,"items":1},
  {"id":26,"sn":26,"nm":"이기선","addr":"문정동 28-3 양지빌라 501호","tp":"다세대","cat":"공동주택","area":23.5,"asset":372000000,"rights":566146800,"agreed":false,"age":"40대","fullAddr":"서울특별시 송파구 동남로6길 3-22, 501호","residing":true,"items":1},
  {"id":27,"sn":27,"nm":"민문홍","addr":"문정동 28-3 양지빌라 502호","tp":"다세대","cat":"공동주택","area":26.4,"asset":417000000,"rights":634632300,"agreed":false,"age":"40대","fullAddr":"서울특별시 관악구","residing":false,"items":1},
  {"id":28,"sn":28,"nm":"전홍기","addr":"문정동 28-4 프로방스빌 201호 외 8건","tp":"다세대","cat":"공동주택","area":216.0,"asset":3308000000,"rights":5034445200,"agreed":false,"age":"","fullAddr":"문정동28-4 501호","residing":true,"items":9},
  {"id":29,"sn":29,"nm":"이상운","addr":"문정동 28-5 파보르빌 201호","tp":"다세대","cat":"공동주택","area":27.61,"asset":424000000,"rights":645285600,"agreed":false,"age":"70대","fullAddr":"서울특별시송파구 송이로23길 30-14","residing":false,"items":1},
  {"id":30,"sn":30,"nm":"신영남","addr":"문정동 28-5 파보르빌 202호","tp":"다세대","cat":"공동주택","area":27.61,"asset":424000000,"rights":645285600,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 문정동 28-5","residing":false,"items":1},
  {"id":31,"sn":31,"nm":"박행주","addr":"문정동 28-5 파보르빌 301호","tp":"다세대","cat":"공동주택","area":27.61,"asset":428000000,"rights":651373200,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 7-7","residing":false,"items":1},
  {"id":32,"sn":32,"nm":"김순례","addr":"문정동 28-5 파보르빌 302호","tp":"다세대","cat":"공동주택","area":27.61,"asset":428000000,"rights":651373200,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로6길 3-16, 302호","residing":true,"items":1},
  {"id":33,"sn":33,"nm":"김정숙","addr":"문정동 28-5 파보르빌 401호","tp":"다세대","cat":"공동주택","area":27.61,"asset":428000000,"rights":651373200,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로6길 3-16,401호","residing":true,"items":1},
  {"id":34,"sn":34,"nm":"한만현","addr":"문정동 28-5 파보르빌 402호","tp":"다세대","cat":"공동주택","area":27.61,"asset":428000000,"rights":651373200,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로 8길3-8","residing":false,"items":1},
  {"id":35,"sn":35,"nm":"조한미","addr":"문정동 28-5 파보르빌 501호","tp":"다세대","cat":"공동주택","area":23.67,"asset":367000000,"rights":558537300,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로6길 3-16, 501호","residing":true,"items":1},
  {"id":36,"sn":36,"nm":"김재식","addr":"문정동 28-5 파보르빌 502호","tp":"다세대","cat":"공동주택","area":25.53,"asset":396000000,"rights":602672400,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 동남로6길 3-16, 502호","residing":true,"items":1},
  {"id":37,"sn":37,"nm":"황재곤","addr":"문정동 28-6 다세대1 201호","tp":"근린생활시설","cat":"상가/기타","area":21.98,"asset":199000000,"rights":302858100,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로 160","residing":false,"items":1},
  {"id":38,"sn":38,"nm":"김인숙","addr":"문정동 28-6 다세대1 202호","tp":"근린생활시설","cat":"상가/기타","area":33.05,"asset":328000000,"rights":499183200,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 송이로28길 4-11","residing":false,"items":1},
  {"id":39,"sn":39,"nm":"이호연","addr":"문정동 28-6 다세대1 203호 외 1건","tp":"근린생활시설","cat":"상가/기타","area":55.03,"asset":498000000,"rights":757906200,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 문정로 83","residing":false,"items":2},
  {"id":40,"sn":40,"nm":"안남희","addr":"문정동 28-6 다세대1 301호 외 1건","tp":"다세대","cat":"공동주택","area":77.64,"asset":1208000000,"rights":1838455200,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 동남로6길 3-14, 501호","residing":false,"items":2},
  {"id":41,"sn":41,"nm":"허서준","addr":"문정동 28-6 다세대1 302호","tp":"다세대","cat":"공동주택","area":33.05,"asset":477000000,"rights":725946300,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 마천로43길42","residing":false,"items":1},
  {"id":42,"sn":42,"nm":"안소정","addr":"문정동 28-6 다세대1 303호","tp":"다세대","cat":"공동주택","area":33.05,"asset":477000000,"rights":725946300,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 강동구 양재대로 1560","residing":false,"items":1},
  {"id":43,"sn":43,"nm":"최에스터혜옥","addr":"문정동 28-6 다세대1 304호","tp":"다세대","cat":"공동주택","area":21.98,"asset":317000000,"rights":482442300,"agreed":false,"age":"60대","fullAddr":"미합중국 펜실베니아주","residing":false,"items":1},
  {"id":44,"sn":44,"nm":"강민희","addr":"문정동 28-6 다세대1 401호","tp":"다세대","cat":"공동주택","area":21.98,"asset":317000000,"rights":482442300,"agreed":false,"age":"40대","fullAddr":"서울특별시 송파구 동남로8길 30-28","residing":false,"items":1},
  {"id":45,"sn":45,"nm":"김미영","addr":"문정동 28-6 다세대1 402호","tp":"다세대","cat":"공동주택","area":33.05,"asset":477000000,"rights":725946300,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 송이로 240","residing":false,"items":1},
  {"id":46,"sn":46,"nm":"김법균","addr":"문정동 28-6 다세대1 403호","tp":"다세대","cat":"공동주택","area":34.01,"asset":485000000,"rights":738121500,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로2길 10","residing":false,"items":1},
  {"id":47,"sn":47,"nm":"허광삼","addr":"문정동 28-6 다세대1 404호","tp":"다세대","cat":"공동주택","area":21.98,"asset":317000000,"rights":482442300,"agreed":false,"age":"50대","fullAddr":"대구광역시 북구 복현로 173","residing":false,"items":1},
  {"id":48,"sn":48,"nm":"임정애","addr":"문정동 28-7 리뉴힐 101호 외 7건","tp":"음식점","cat":"상가/기타","area":343.77,"asset":4810000000,"rights":7320339000,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로6길 3-10","residing":true,"items":8},
  {"id":49,"sn":49,"nm":"이분례","addr":"문정동 28-8","tp":"단독주택","cat":"단독/다가구","area":175.6,"asset":2189136800,"rights":3331647295,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-8","residing":true,"items":1},
  {"id":50,"sn":50,"nm":"조현길","addr":"문정동 28-10","tp":"제1종근린생활시설","cat":"상가/기타","area":147.2,"asset":1809496320,"rights":2753872449,"agreed":false,"age":"40대","fullAddr":"서울특별시 강남구 학동로97길 31","residing":false,"items":1},
  {"id":51,"sn":51,"nm":"김윤지","addr":"문정동 28-11 그린파크빌라 101호","tp":"다세대","cat":"공동주택","area":31.94,"asset":382000000,"rights":581365800,"agreed":false,"age":"40대","fullAddr":"서울특별시 송파구 동남로6길 7-5, 101호","residing":true,"items":1},
  {"id":52,"sn":52,"nm":"송상이","addr":"문정동 28-11 그린파크빌라 102호","tp":"다세대","cat":"공동주택","area":31.94,"asset":382000000,"rights":581365800,"agreed":false,"age":"80대 이상","fullAddr":"부천시 소사구 송내동","residing":false,"items":1},
  {"id":53,"sn":53,"nm":"조정이","addr":"문정동 28-11 그린파크빌라 201호","tp":"다세대","cat":"공동주택","area":31.94,"asset":403000000,"rights":613325700,"agreed":false,"age":"70대","fullAddr":"울산시 서부동","residing":false,"items":1},
  {"id":54,"sn":54,"nm":"홍득선","addr":"문정동 28-11 그린파크빌라 202호","tp":"다세대","cat":"공동주택","area":31.94,"asset":403000000,"rights":613325700,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로 193","residing":false,"items":1},
  {"id":55,"sn":55,"nm":"남철우","addr":"문정동 28-11 그린파크빌라 301호","tp":"다세대","cat":"공동주택","area":31.94,"asset":416000000,"rights":633110400,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로6길 7-5, 301호","residing":true,"items":1},
  {"id":56,"sn":56,"nm":"황준우","addr":"문정동 28-11 그린파크빌라 302호","tp":"다세대","cat":"공동주택","area":31.94,"asset":416000000,"rights":633110400,"agreed":false,"age":"40대","fullAddr":"서울특별시 송파구 동남로6길 7-5, 302호","residing":true,"items":1},
  {"id":57,"sn":57,"nm":"안현규","addr":"문정동 28-11 그린파크빌라 401호","tp":"다세대","cat":"공동주택","area":24.43,"asset":318000000,"rights":483964200,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-11","residing":true,"items":1},
  {"id":58,"sn":58,"nm":"이지현","addr":"문정동 28-11 그린파크빌라 402호","tp":"다세대","cat":"공동주택","area":24.43,"asset":318000000,"rights":483964200,"agreed":false,"age":"60대","fullAddr":"서울특별시 성동구 무학로6길 10","residing":false,"items":1},
  {"id":59,"sn":59,"nm":"박영숙","addr":"문정동 28-12","tp":"단독주택","cat":"단독/다가구","area":169.5,"asset":1999462600,"rights":3042982130,"agreed":false,"age":"60대","fullAddr":"서울특별시 강동구 고덕로 131","residing":false,"items":1},
  {"id":60,"sn":60,"nm":"박복순","addr":"문정동 28-13","tp":"단독주택","cat":"단독/다가구","area":200.4,"asset":2464858720,"rights":3751268485,"agreed":false,"age":"80대 이상","fullAddr":"서울특별시 송파구 동남로6길 7-11","residing":true,"items":1},
  {"id":61,"sn":61,"nm":"김지현","addr":"문정동 28-14","tp":"단독주택","cat":"단독/다가구","area":169.0,"asset":2107267440,"rights":3207160316,"agreed":false,"age":"50대","fullAddr":"서울 송파구 오금동 165","residing":false,"items":1},
  {"id":62,"sn":62,"nm":"장혜경","addr":"문정동 28-15 청구아트빌라 101호","tp":"연립주택","cat":"공동주택","area":56.4,"asset":691000000,"rights":1051632900,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로6길 7-19, 101호","residing":true,"items":1},
  {"id":63,"sn":63,"nm":"손호인","addr":"문정동 28-15 청구아트빌라 102호","tp":"연립주택","cat":"공동주택","area":62.9,"asset":770000000,"rights":1171863000,"agreed":false,"age":"80대 이상","fullAddr":"서울특별시 송파구 동남로6길 7-19, 102호","residing":true,"items":1},
  {"id":64,"sn":64,"nm":"신승오","addr":"문정동 28-15 청구아트빌라 103호","tp":"연립주택","cat":"공동주택","area":65.64,"asset":804000000,"rights":1223607600,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로3길 4","residing":false,"items":1},
  {"id":65,"sn":65,"nm":"정점숙","addr":"문정동 28-15 청구아트빌라 201호","tp":"연립주택","cat":"공동주택","area":58.82,"asset":743000000,"rights":1130771700,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로6길 7-19, 201호","residing":true,"items":1},
  {"id":66,"sn":66,"nm":"문수원","addr":"문정동 28-15 청구아트빌라 202호","tp":"연립주택","cat":"공동주택","area":62.9,"asset":795000000,"rights":1209910500,"agreed":false,"age":"70대","fullAddr":"서울 송파구 석촌동 251-3","residing":false,"items":1},
  {"id":67,"sn":67,"nm":"양윤숙","addr":"문정동 28-15 청구아트빌라 203호","tp":"연립주택","cat":"공동주택","area":65.64,"asset":829000000,"rights":1261655100,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-15","residing":true,"items":1},
  {"id":68,"sn":68,"nm":"장영훈","addr":"문정동 28-15 청구아트빌라 301호","tp":"연립주택","cat":"공동주택","area":51.1,"asset":652000000,"rights":992278800,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 백제고분로32길 40-36","residing":false,"items":1},
  {"id":69,"sn":69,"nm":"송용암","addr":"문정동 28-15 청구아트빌라 302호","tp":"연립주택","cat":"공동주택","area":53.5,"asset":683000000,"rights":1039457700,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 송이로12길 11","residing":false,"items":1},
  {"id":70,"sn":70,"nm":"김형준","addr":"문정동 28-15 청구아트빌라 303호","tp":"연립주택","cat":"공동주택","area":49.0,"asset":625000000,"rights":951187500,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 문정동 28-15","residing":false,"items":1},
  {"id":71,"sn":71,"nm":"윤명희","addr":"문정동 28-17","tp":"단독주택","cat":"단독/다가구","area":155.5,"asset":2136484960,"rights":3251516460,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 문정동 28-17","residing":true,"items":1},
  {"id":72,"sn":72,"nm":"정래균","addr":"문정동 28-18","tp":"단독주택","cat":"단독/다가구","area":138.2,"asset":1755403600,"rights":2671548738,"agreed":false,"age":"80대 이상","fullAddr":"서울특별시 송파구 동남로6길 7-18","residing":true,"items":1},
  {"id":73,"sn":73,"nm":"이재범외1","addr":"문정동 28-19","tp":"단독주택","cat":"단독/다가구","area":167.3,"asset":2143371000,"rights":3261996324,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 문정동 28-19","residing":false,"items":1},
  {"id":74,"sn":74,"nm":"김태훈","addr":"문정동 28-21 청기와아트빌라 101호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":553000000,"rights":841610700,"agreed":false,"age":"60대","fullAddr":"송파구 문정동28-21 101호","residing":false,"items":1},
  {"id":75,"sn":75,"nm":"선순남","addr":"문정동 28-21 청기와아트빌라 102호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":553000000,"rights":841610700,"agreed":false,"age":"50대","fullAddr":"전북특별자치도 정읍시","residing":false,"items":1},
  {"id":76,"sn":76,"nm":"정정미","addr":"문정동 28-21 청기와아트빌라 103호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":553000000,"rights":841610700,"agreed":false,"age":"50대","fullAddr":"서울특별시 강동구 성내동","residing":false,"items":1},
  {"id":77,"sn":77,"nm":"전수기","addr":"문정동 28-21 청기와아트빌라 105호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":553000000,"rights":841610700,"agreed":false,"age":"80대 이상","fullAddr":"서울특별시 송파구 동남로6길 7-8, 105호","residing":true,"items":1},
  {"id":78,"sn":78,"nm":"김경화","addr":"문정동 28-21 청기와아트빌라 201호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":569000000,"rights":865961100,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 송이로 242","residing":false,"items":1},
  {"id":79,"sn":79,"nm":"이귀록","addr":"문정동 28-21 청기와아트빌라 202호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":569000000,"rights":865961100,"agreed":false,"age":"70대","fullAddr":"경기도 광주시 곤지암읍","residing":true,"items":1},
  {"id":80,"sn":80,"nm":"김창배","addr":"문정동 28-21 청기와아트빌라 203호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":569000000,"rights":865961100,"agreed":false,"age":"60대","fullAddr":"서울 송파구 문정동 28-21","residing":true,"items":1},
  {"id":81,"sn":81,"nm":"이영숙","addr":"문정동 28-21 청기와아트빌라 205호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":569000000,"rights":865961100,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 백제고분로45길 27","residing":false,"items":1},
  {"id":82,"sn":82,"nm":"장병수외1","addr":"문정동 28-21 청기와아트빌라 301호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":575000000,"rights":875092500,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 문정동28-21 301호","residing":false,"items":1},
  {"id":83,"sn":83,"nm":"황혜순","addr":"문정동 28-21 청기와아트빌라 302호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":575000000,"rights":875092500,"agreed":false,"age":"80대 이상","fullAddr":"경기도 광주시 경충대로","residing":true,"items":1},
  {"id":84,"sn":84,"nm":"최일동","addr":"문정동 28-21 청기와아트빌라 303호","tp":"연립주택","cat":"공동주택","area":52.8,"asset":575000000,"rights":875092500,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로6길 7-8, 303호","residing":true,"items":1},
  {"id":85,"sn":85,"nm":"주효경","addr":"문정동 28-21 청기와아트빌라 305호","tp":"연립주택","cat":"공동주택","area":51.2,"asset":556000000,"rights":846176400,"agreed":false,"age":"40대","fullAddr":"서울특별시 마포구 양화로1길 52","residing":false,"items":1},
  {"id":86,"sn":86,"nm":"신수현","addr":"문정동 28-23","tp":"단독주택","cat":"단독/다가구","area":206.1,"asset":2605570360,"rights":3965417530,"agreed":false,"age":"70대","fullAddr":"서울 강동구 둔촌동 180-1","residing":false,"items":1},
  {"id":87,"sn":87,"nm":"장희진","addr":"문정동 28-24","tp":"근린생활시설","cat":"상가/기타","area":413.9,"asset":5112136800,"rights":7780160995,"agreed":false,"age":"80대 이상","fullAddr":"경기도 광주시 곤지암읍","residing":false,"items":1},
  {"id":88,"sn":88,"nm":"김재상","addr":"문정동 28-26 다세대2 101호 외 6건","tp":"근린생활시설","cat":"상가/기타","area":205.97,"asset":3032000000,"rights":4614400800,"agreed":false,"age":"50대","fullAddr":"서울특별시 송파구 동남로2길 24","residing":false,"items":7},
  {"id":89,"sn":89,"nm":"황정자외1","addr":"문정동 28-27 다세대3 201호 외 9건","tp":"다세대","cat":"공동주택","area":226.9,"asset":3284000000,"rights":4997919600,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 송이로28길 24-1","residing":false,"items":10},
  {"id":90,"sn":90,"nm":"조성천","addr":"문정동 28-28 함께꿈꾸는마을 201호 외 13건","tp":"근린생활시설","cat":"상가/기타","area":227.1,"asset":3393000000,"rights":5163806700,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 문정동28-28 501호","residing":false,"items":14},
  {"id":91,"sn":91,"nm":"송파구","addr":"문정동 28-29","tp":"기타","cat":"상가/기타","area":467.5,"asset":5221975000,"rights":7947323752,"agreed":false,"age":"","fullAddr":"","residing":false,"items":1},
  {"id":92,"sn":92,"nm":"강인순외6","addr":"문정동 28-31","tp":"제1종근린생활시설","cat":"상가/기타","area":175.6,"asset":2279224000,"rights":3468751005,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 동남로6길 3-6","residing":true,"items":1},
  {"id":93,"sn":93,"nm":"문순예","addr":"문정동 28-32 청기와빌라 b01호","tp":"다세대","cat":"공동주택","area":28.5,"asset":341000000,"rights":518967900,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로8길 21","residing":false,"items":1},
  {"id":94,"sn":94,"nm":"송재순","addr":"문정동 28-32 청기와빌라 b02호","tp":"다세대","cat":"공동주택","area":27.9,"asset":335000000,"rights":509836500,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 송이로38길 8-1","residing":false,"items":1},
  {"id":95,"sn":95,"nm":"정우옥","addr":"문정동 28-32 청기와빌라 101호","tp":"다세대","cat":"공동주택","area":28.5,"asset":313000000,"rights":476354700,"agreed":false,"age":"60대","fullAddr":"서울특별시 송파구 동남로6길 7-12, 101호","residing":true,"items":1},
  {"id":96,"sn":96,"nm":"허선열","addr":"문정동 28-32 청기와빌라 102호","tp":"다세대","cat":"공동주택","area":28.0,"asset":307000000,"rights":467223300,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 문정동 28-32","residing":true,"items":1},
  {"id":97,"sn":97,"nm":"박소윤외1","addr":"문정동 28-32 청기와빌라 201호","tp":"다세대","cat":"공동주택","area":28.5,"asset":331000000,"rights":503748900,"agreed":false,"age":"40대 미만","fullAddr":"서울특별시 송파구 동남로6길 7-12, 201호","residing":true,"items":1},
  {"id":98,"sn":98,"nm":"이옥순","addr":"문정동 28-32 청기와빌라 202호","tp":"다세대","cat":"공동주택","area":28.0,"asset":325000000,"rights":494617500,"agreed":false,"age":"70대","fullAddr":"서울특별시 송파구 새말로15길 20-12","residing":false,"items":1},
  {"id":99,"sn":99,"nm":"정재운외5","addr":"문정동 28-35","tp":"단독주택","cat":"단독/다가구","area":235.1,"asset":2907692040,"rights":4425216515,"agreed":false,"age":"","fullAddr":"서울특별시 송파구 문정동 28-35","residing":true,"items":1},
  {"id":100,"sn":100,"nm":"박활성외2","addr":"문정동 28-36 외 1건","tp":"단독주택","cat":"단독/다가구","area":208.8,"asset":2612076480,"rights":3975319194,"agreed":false,"age":"50대","fullAddr":"서울특별시 강동구 올림픽로112길 17","residing":false,"items":2}
];

const RATIO = 152.19;
const PRICE_46 = 866277500;
const PRICE_59 = 1135557500;
const PRICE_84 = 1539477500;
const AREA_46 = 18.53;
const AREA_59 = 24.29;
const AREA_84 = 32.93;

const fmt = (n) => {
  if (n === undefined || isNaN(n)) return "0원";
  const neg = n < 0;
  const a = Math.abs(Math.round(n));
  const eok = Math.floor(a / 1e8);
  const man = Math.floor((a % 1e8) / 1e4);
  let r = neg ? "-" : "";
  if (eok > 0) r += `${eok}억`;
  if (man > 0) r += ` ${man.toLocaleString()}만`;
  if (!eok && !man) r = "0";
  return r + "원";
};
const fmtNum = (n) => Math.round(n).toLocaleString();

const extractUnit = (addr, cat) => {
  if (cat !== "공동주택") return "";
  const match = addr.match(/([0-9a-zA-Z가-힣]+호)/);
  return match ? match[1] : "";
};

// ─── Icons ───
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

// ─── BASE POLYS ───
const BASE_POLYS = {
  "28-31": [[15, 0], [25, 0], [25, 15], [15, 15]],
  "28-8":  [[25, 0], [35, 0], [35, 15], [25, 15]],
  "28-7":  [[35, 0], [45, 0], [45, 15], [35, 15]],
  "28-6":  [[45, 0], [55, 0], [55, 15], [45, 15]],
  "28-5":  [[55, 0], [65, 0], [65, 15], [55, 15]],
  "28-4":  [[65, 0], [75, 0], [75, 15], [65, 15]],
  "28-3":  [[75, 0], [86, 0], [86, 15], [75, 15]],
  "28-2":  [[86, 0], [100, 0], [100, 26], [86, 26]],
  "28-1":  [[86, 26], [100, 26], [100, 45], [86, 45]],
  "28":    [[86, 45], [100, 45], [100, 60], [86, 60]],
  "28-10": [[0, 15], [14, 15], [14, 26], [0, 26]],
  "28-11": [[14, 15], [28, 15], [28, 26], [14, 26]],
  "28-12": [[28, 15], [40, 15], [40, 26], [28, 26]],
  "28-13": [[40, 15], [50, 15], [50, 26], [40, 26]],
  "28-14": [[50, 15], [60, 15], [60, 26], [50, 26]],
  "28-35": [[60, 15], [70, 15], [70, 26], [60, 26]],
  "28-15": [[70, 15], [86, 15], [86, 26], [70, 26]],
  "28-29": [[0, 26], [86, 26], [86, 30], [76, 30], [76, 60], [70, 60], [70, 30], [0, 30]],
  "28-23": [[0, 30], [14, 30], [14, 45], [0, 45]],
  "28-21": [[14, 30], [28, 30], [28, 45], [14, 45]],
  "28-32": [[28, 30], [42, 30], [42, 45], [28, 45]],
  "28-19": [[42, 30], [56, 30], [56, 45], [42, 45]],
  "28-18": [[56, 30], [70, 30], [70, 45], [56, 45]],
  "28-34": [[76, 30], [86, 30], [86, 60], [76, 60]],
  "28-24": [[0, 45], [22, 45], [22, 60], [0, 60]],
  "28-26": [[22, 45], [32, 45], [32, 60], [22, 60]],
  "28-27": [[32, 45], [42, 45], [42, 60], [32, 60]],
  "28-28": [[42, 45], [52, 45], [52, 60], [42, 60]],
  "28-36": [[52, 45], [61, 45], [61, 60], [52, 60]],
  "28-17": [[61, 45], [70, 45], [70, 60], [61, 60]]
};

const MANUAL_CENTERS = { "28-29": [35, 28] };
const BASE_RED_BOUNDARY = [[15, 0], [100, 0], [100, 60], [0, 60], [0, 15], [15, 15], [15, 0]];
const OWNER_LOTS = {1:["28"],2:["28-1","28-34"],3:["28-1"],4:["28-1"],5:["28-1"],6:["28-1"],7:["28-1"],8:["28-1"],9:["28-1"],10:["28-1"],11:["28-2"],12:["28-2"],13:["28-2"],14:["28-2"],15:["28-2"],16:["28-2"],17:["28-2"],18:["28-2"],19:["28-2"],20:["28-3"],21:["28-3"],22:["28-3"],23:["28-3"],24:["28-3"],25:["28-3"],26:["28-3"],27:["28-3"],28:["28-4"],29:["28-5"],30:["28-5"],31:["28-5"],32:["28-5"],33:["28-5"],34:["28-5"],35:["28-5"],36:["28-5"],37:["28-6"],38:["28-6"],39:["28-6"],40:["28-6"],41:["28-6"],42:["28-6"],43:["28-6"],44:["28-6"],45:["28-6"],46:["28-6"],47:["28-6"],48:["28-7"],49:["28-8"],50:["28-10"],51:["28-11"],52:["28-11"],53:["28-11"],54:["28-11"],55:["28-11"],56:["28-11"],57:["28-11"],58:["28-11"],59:["28-12"],60:["28-13"],61:["28-14"],62:["28-15"],63:["28-15"],64:["28-15"],65:["28-15"],66:["28-15"],67:["28-15"],68:["28-15"],69:["28-15"],70:["28-15"],71:["28-17"],72:["28-18"],73:["28-19"],74:["28-21"],75:["28-21"],76:["28-21"],77:["28-21"],78:["28-21"],79:["28-21"],80:["28-21"],81:["28-21"],82:["28-21"],83:["28-21"],84:["28-21"],85:["28-21"],86:["28-23"],87:["28-24"],88:["28-26"],89:["28-27"],90:["28-28"],91:["28-29"],92:["28-31"],93:["28-32"],94:["28-32"],95:["28-32"],96:["28-32"],97:["28-32"],98:["28-32"],99:["28-35"],100:["28-36"]};

const AUTHORIZED_USERS = [
  { id: "u1", name: "최희현", role: "부회장", pin: "1001" },
  { id: "u2", name: "최광식", role: "부사장", pin: "1002" },
  { id: "u3", name: "이민후", role: "팀장", pin: "1003" },
  { id: "u4", name: "OS요원", role: "담당", pin: "1004" },
  { id: "u5", name: "이관석", role: "대표이사", pin: "1005" },
  { id: "master", name: "시스템", role: "관리자", pin: "5162" }
];

// ─── Login Screen Component ───
function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId) { setErr("접속할 담당자를 선택해주세요."); return; }
    const user = AUTHORIZED_USERS.find(u => u.id === userId);
    if (pwd !== user.pin) { setErr("비밀번호가 일치하지 않습니다."); return; }
    onLogin(user.role === "담당" ? user.name : `${user.name} ${user.role}`);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0C0C0E", color: "#E8E6E1", fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ background: "#161618", padding: "32px 24px", borderRadius: 16, width: "90%", maxWidth: 360, border: "1px solid #2A2A2E", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>가로주택정비사업</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>현장지원 시스템 보안 로그인</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ width: "100%", padding: "14px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: userId ? "#fff" : "#9CA3AF", fontSize: 15, outline: "none", appearance: "none" }}>
            <option value="" disabled>담당자 선택</option>
            {AUTHORIZED_USERS.map(u => <option key={u.id} value={u.id}>{u.name} {u.role}</option>)}
          </select>
          <input type="password" placeholder="접속 비밀번호 (PIN)" value={pwd} onChange={(e) => setPwd(e.target.value)} style={{ padding: "14px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#fff", fontSize: 15, outline: "none", letterSpacing: 2 }} />
          {err && <p style={{ color: "#FF2A55", fontSize: 12, fontWeight: 700 }}>{err}</p>}
          <button type="submit" className="btn-press" style={{ marginTop: 12, padding: "16px", background: "linear-gradient(135deg, #FF2A55, #C81A40)", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>시스템 접속</button>
        </form>
      </div>
    </div>
  );
}

// ─── 메인 App 컴포넌트 ───
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [owners, setOwners] = useState([]);
  const [view, setView] = useState("dash"); 
  const [selectedId, setSelectedId] = useState(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [catTab, setCatTab] = useState("공동주택");

  // 파이어베이스 데이터 실시간 리스너 연결
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

  // 데이터 수정 시 파이어베이스 서버에 즉시 저장
  const updateOwner = useCallback(async (id, updates) => {
    try {
      setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      const ownerRef = doc(db, "owners", String(id));
      await updateDoc(ownerRef, updates);
    } catch (error) {
      console.error("데이터 업데이트 실패:", error);
    }
  }, []);

  // 서버에 기초 데이터를 처음 한 번만 밀어넣는 함수
  const syncInitialData = async () => {
    if (!window.confirm("100명의 기초 데이터를 서버에 등록하시겠습니까?")) return;
    try {
      const batch = writeBatch(db);
      RAW_OWNERS.forEach(o => {
        const docRef = doc(db, "owners", String(o.id));
        batch.set(docRef, { ...o, memoHistory: [], disposition: "", agreedBy: "" });
      });
      await batch.commit();
      alert("동기화 성공!");
    } catch (e) {
      console.error(e);
      alert("동기화 실패");
    }
  };

  const stats = useMemo(() => {
    const total = owners.length;
    const agreed = owners.filter(o => o.agreed).length;
    const totalArea = owners.reduce((s, o) => s + o.area, 0);
    const agreedArea = owners.filter(o => o.agreed).reduce((s, o) => s + o.area, 0);
    const todayCount = owners.filter(o => o.consentDate === new Date().toISOString().split("T")[0]).length;
    const byCategory = {};
    ["공동주택", "단독/다가구", "상가/기타"].forEach(c => {
      const all = owners.filter(o => o.cat === c);
      const ag = all.filter(o => o.agreed);
      byCategory[c] = { total: all.length, agreed: ag.length, totalArea: all.reduce((s, o) => s + o.area, 0), agreedArea: ag.reduce((s, o) => s + o.area, 0) };
    });
    return { total, agreed, totalArea, agreedArea, todayCount, byCategory, ownerRate: total ? (agreed / total * 100) : 0, areaRate: totalArea ? (agreedArea / totalArea * 100) : 0 };
  }, [owners]);

  const targetOwner = 75;
  const targetArea = 66.7;
  const remainingOwner = Math.max(0, Math.ceil(stats.total * targetOwner / 100) - stats.agreed);
  const remainingArea = Math.max(0, (stats.totalArea * targetArea / 100) - stats.agreedArea);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 800 && view === "map") setView("dash"); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const selected = selectedId != null ? owners.find(o => o.id === selectedId) : null;

  return (
    <div className="app-wrapper">
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        body { background: #0C0C0E; font-family: 'Pretendard', sans-serif; margin: 0; overflow: hidden; }
        .app-wrapper { display: flex; width: 100vw; height: 100vh; overflow: hidden; }
        .left-pane { width: 100%; max-width: 480px; height: 100vh; display: flex; flex-direction: column; position: relative; background: #0C0C0E; z-index: 10; margin: 0 auto; border-right: 1px solid #1E1E22; }
        .right-pane { display: none; flex: 1; height: 100vh; background: #0a0a0a; border-left: 1px solid #1E1E22; padding: 24px; flex-direction: column; }
        @media (min-width: 800px) { .right-pane { display: flex; } }
        .btn-press { transition: transform 0.1s; } .btn-press:active { transform: scale(0.96); }
        .mobile-map-inner { height: 480px; border-radius: 16px; overflow: hidden; border: 1px solid #2A2A2E; position: relative; background: #0a0a0a; }
      `}</style>
      
      <div className="left-pane">
        {selected ? (
          <DetailView key={selected.id} owner={selected} onBack={() => setSelectedId(null)} updateOwner={updateOwner} currentUser={currentUser} />
        ) : (
          <>
            <header style={{ padding: "16px 20px 12px", background: "linear-gradient(180deg, #0C0C0E 0%, transparent 100%)", position: "sticky", top: 0, zIndex: 50 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: 2 }}>송파구 문정동 28번지</p>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: "#E8E6E1", marginTop: 2 }}>가로주택정비사업</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* 동기화 버튼 (구석에 숨김) */}
                  <button onClick={syncInitialData} style={{ opacity: 0.1, fontSize: 8, color: "#fff", background: "none", border: "1px solid #fff", borderRadius: 4, padding: "2px 4px", cursor: 'pointer' }}>SYNC</button>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#E8E6E1", fontWeight: 700 }}>{currentUser}</p>
                    <button onClick={() => setCurrentUser(null)} style={{ background: "rgba(255, 42, 85, 0.1)", border: "none", color: "#FF2A55", borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>로그아웃</button>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #FF2A55, #C81A40)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>{stats.agreed}</div>
                </div>
              </div>
            </header>

            <main style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>
              {view === "dash" && <Dashboard stats={stats} remainingOwner={remainingOwner} remainingArea={remainingArea} setView={setView} setFilter={setFilter} target={{ owner: targetOwner, area: targetArea }} />}
              {view === "cat" && <CategoryView stats={stats} catTab={catTab} setCatTab={setCatTab} />}
              {view === "map" && <div className="mobile-only-map"><InteractiveSvgMap owners={owners} onSelect={setSelectedId} mapFilter={filter} setMapFilter={setFilter} stats={stats} isDesktop={false} /></div>}
              {view === "list" && <ListView owners={owners} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onSelect={setSelectedId} stats={stats} />}
            </main>

            <nav style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(12,12,14,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid #1E1E22", display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 50 }}>
              <button onClick={() => setView("dash")} style={{ background: "none", border: "none", color: view === "dash" ? "#FF2A55" : "#9CA3AF", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><IconHome size={22} /><span style={{ fontSize: 10, fontWeight: 700 }}>대시보드</span></button>
              <button onClick={() => setView("map")} style={{ background: "none", border: "none", color: view === "map" ? "#FF2A55" : "#9CA3AF", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><IconMap size={22} /><span style={{ fontSize: 10, fontWeight: 700 }}>지적도</span></button>
              <button onClick={() => setView("cat")} style={{ background: "none", border: "none", color: view === "cat" ? "#FF2A55" : "#9CA3AF", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><IconChart size={22} /><span style={{ fontSize: 10, fontWeight: 700 }}>용도별</span></button>
              <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: view === "list" ? "#FF2A55" : "#9CA3AF", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><IconUsers size={22} /><span style={{ fontSize: 10, fontWeight: 700 }}>소유자</span></button>
            </nav>
          </>
        )}
      </div>

      <div className="right-pane">
        <InteractiveSvgMap owners={owners} onSelect={setSelectedId} mapFilter={filter} setMapFilter={setFilter} stats={stats} isDesktop={true} initialScale={0.8} />
      </div>
    </div>
  );
}

// ─── 지적도 매핑 컴포넌트 ─── [cite: 89-181]
function InteractiveSvgMap({ owners, onSelect, mapFilter, setMapFilter, stats, isDesktop = false, initialScale = 0.45 }) {
  const [panZoom, setPanZoom] = useState({ x: 0, y: 0, scale: initialScale });
  const [selectedLot, setSelectedLot] = useState(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, isMoved: false });

  const lotData = useMemo(() => {
    const lots = {};
    Object.entries(BASE_POLYS).forEach(([jibun, p]) => {
      const ownersOnLot = owners.filter(o => (OWNER_LOTS[o.sn] || []).includes(jibun));
      const totalCount = ownersOnLot.length;
      const agreedCount = ownersOnLot.filter(o => o.agreed).length;
      const xSum = p.reduce((s, pt) => s + pt[0], 0) / p.length;
      const ySum = p.reduce((s, pt) => s + pt[1], 0) / p.length;
      lots[jibun] = { jibun, center: MANUAL_CENTERS[jibun] || [xSum, ySum], polygon: p, owners: ownersOnLot, totalCount, agreedCount, allAgreed: totalCount > 0 && agreedCount === totalCount, someAgreed: agreedCount > 0 && agreedCount < totalCount, noneAgreed: totalCount > 0 && agreedCount === 0, isEmpty: totalCount === 0 };
    });
    return lots;
  }, [owners]);

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { isDragging: true, startX: clientX, startY: clientY, initialX: panZoom.x, initialY: panZoom.y, isMoved: false };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX; const dy = clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.isMoved = true;
    setPanZoom(prev => ({ ...prev, x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy }));
  };

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: '#0a0a0a', borderRadius: 16, border: '1px solid #2A2A2E' }} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={() => dragRef.current.isDragging = false} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={() => dragRef.current.isDragging = false}>
      <svg viewBox="-5 -5 110 70" style={{ width: '100%', height: '100%', transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`, transformOrigin: 'center' }}>
        {Object.values(lotData).map(lot => (
          <g key={lot.jibun} onClick={() => { if(!dragRef.current.isMoved && !lot.isEmpty) setSelectedLot(lot); }} style={{ cursor: 'pointer' }}>
            <polygon points={lot.polygon.map(pt => pt.join(',')).join(' ')} fill={lot.isEmpty ? '#111' : lot.allAgreed ? '#22C55E66' : lot.someAgreed ? '#EAB30866' : '#EF444433'} stroke="#4A4A55" strokeWidth="0.2" />
            <text x={lot.center[0]} y={lot.center[1]} fontSize="2" fill="#fff" textAnchor="middle" fontWeight="bold">{lot.jibun.split('-')[1] || lot.jibun}</text>
          </g>
        ))}
        <polygon points={BASE_RED_BOUNDARY.map(pt => pt.join(',')).join(' ')} fill="none" stroke="#FF2A55" strokeWidth="0.5" strokeDasharray="1,1" />
      </svg>
      {selectedLot && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 20, borderRadius: 16, color: '#000', width: 260, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3>문정동 {selectedLot.jibun}</h3><button onClick={() => setSelectedLot(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button></div>
          <div style={{ maxHeight: 250, overflowY: 'auto', marginTop: 12 }}>
            {selectedLot.owners.map(o => <div key={o.id} onClick={() => { onSelect(o.id); setSelectedLot(null); }} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}><span>{o.nm}</span><span style={{ fontSize: 11, color: o.agreed ? '#22C55E' : '#EF4444' }}>{o.agreed ? '동의' : '미동'}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 대시보드 컴포넌트 ─── [cite: 181-196]
function Dashboard({ stats, remainingOwner, remainingArea, setView, setFilter, target }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard label="전체 소유자" value={`${stats.total}명`} sub={`동의 ${stats.agreed}명`} accent="#FF2A55" />
        <StatCard label="오늘 동의" value={`+${stats.todayCount}건`} sub="실시간 업데이트" accent="#5BA87F" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DonutCard title="소유자 동의율" percent={stats.ownerRate} target={target.owner} sub={`${stats.agreed}/${stats.total}명`} color="#FF2A55" gradStart="#FF8A00" />
        <DonutCard title="면적 동의율" percent={stats.areaRate} target={target.area} sub={`${fmtNum(stats.agreedArea)}㎡`} color="#5BA87F" gradStart="#00E676" />
      </div>
      <div style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 12 }}>유형별 동의 현황</p>
        {["공동주택", "단독/다가구", "상가/기타"].map(c => {
          const d = stats.byCategory[c];
          return (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1E1E22" }}>
              <span style={{ color: "#E8E6E1", fontSize: 13 }}>{c} ({d.total}명)</span>
              <span style={{ color: "#FF2A55", fontWeight: 700 }}>{(d.agreed / (d.total || 1) * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 상세 보기 컴포넌트 ─── [cite: 229-281]
function DetailView({ owner, onBack, updateOwner, currentUser }) {
  const [newMemo, setNewMemo] = useState("");
  const [assetStr, setAssetStr] = useState(String(owner.asset || 0));
  
  const asset = Number(assetStr.replace(/[^0-9]/g, ""));
  const rights = Math.floor(asset * (RATIO / 100));
  const contribution = PRICE_84 - rights;

  const handleAddMemo = () => {
    if (!newMemo.trim()) return;
    const m = { id: Date.now(), date: new Date().toLocaleString(), author: currentUser, text: newMemo };
    updateOwner(owner.id, { memoHistory: [...(owner.memoHistory || []), m] });
    setNewMemo("");
  };

  return (
    <div style={{ padding: "20px", color: "#E8E6E1", overflowY: 'auto', height: '100vh', paddingBottom: 100 }}>
      <button onClick={onBack} style={{ color: "#FF2A55", background: "none", border: "none", marginBottom: 16, cursor: 'pointer' }}>← 뒤로가기</button>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>{owner.nm} 소유주</h2>
      <div style={{ background: "#161618", padding: 20, borderRadius: 16, marginTop: 16, border: "1px solid #1E1E22" }}>
        <p style={{ color: "#9CA3AF", fontSize: 12 }}>주소: {owner.addr}</p>
        <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>면적: {owner.area}㎡ / 유형: {owner.tp}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20 }}>
          <button onClick={() => updateOwner(owner.id, { agreed: true, agreedBy: currentUser, consentDate: new Date().toISOString().split('T')[0] })} style={{ padding: 14, borderRadius: 12, border: "none", background: owner.agreed ? "#22C55E" : "#2A2A2E", color: "#fff", fontWeight: 700, cursor: 'pointer' }}>동의 완료</button>
          <button onClick={() => updateOwner(owner.id, { agreed: false })} style={{ padding: 14, borderRadius: 12, border: "none", background: !owner.agreed ? "#EF4444" : "#2A2A2E", color: "#fff", fontWeight: 700, cursor: 'pointer' }}>미동의</button>
        </div>
      </div>

      <div style={{ background: "#161618", padding: 20, borderRadius: 16, marginTop: 16, border: "1px solid #1E1E22" }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>분담금 시뮬레이션</h3>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>종전자산 가액</p>
          <div style={{ position: "relative" }}><input value={asset.toLocaleString()} onChange={e => setAssetStr(e.target.value)} style={{ width: "100%", padding: 12, background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#fff", textAlign: "right" }} /><span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 12 }}>원</span></div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #2A2A2E" }}>
          <ResultRow label="권리가액 (비례율 152.19%)" value={rights.toLocaleString()} sub={fmt(rights)} />
          <ResultRow label="84타입 추정 분담금" value={contribution.toLocaleString()} sub={fmt(contribution)} accent="#FF2A55" />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>상담 메모</h3>
        <textarea value={newMemo} onChange={e => setNewMemo(e.target.value)} placeholder="상담 내용을 기록하세요..." style={{ width: "100%", height: 100, background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 12, color: "#fff", padding: 12 }} />
        <button onClick={handleAddMemo} style={{ width: "100%", padding: 12, background: "#FF2A55", color: "#fff", border: "none", borderRadius: 12, marginTop: 8, fontWeight: 700, cursor: 'pointer' }}>메모 추가</button>
        <div style={{ marginTop: 16 }}>
          {(owner.memoHistory || []).slice().reverse().map(m => (
            <div key={m.id} style={{ background: "#2A2A2E", padding: 12, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}><span>{m.author}</span><span>{m.date}</span></div>
              <p style={{ fontSize: 13 }}>{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 리스트 컴포넌트 ─── [cite: 215-228]
function ListView({ owners, filter, setFilter, search, setSearch, onSelect }) {
  const filtered = owners.filter(o => {
    const match = !search || o.nm.includes(search) || o.addr.includes(search);
    if (filter === "동의완료") return match && o.agreed;
    if (filter === "미동의") return match && !o.agreed;
    return match;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 주소로 검색..." style={{ width: "100%", padding: 14, background: "#161618", border: "1px solid #1E1E22", borderRadius: 12, color: "#fff" }} />
      <div style={{ display: "flex", gap: 6, overflowX: 'auto' }}>
        {["전체", "미동의", "동의완료"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: filter === f ? "#FF2A55" : "#1E1E22", color: "#fff", fontSize: 12, cursor: 'pointer' }}>{f}</button>)}
      </div>
      {filtered.map(o => (
        <div key={o.id} onClick={() => onSelect(o.id)} style={{ background: "#161618", padding: 16, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: "1px solid #1E1E22" }}>
          <div><p style={{ fontWeight: 700, color: "#E8E6E1" }}>{o.nm}</p><p style={{ fontSize: 11, color: "#9CA3AF" }}>{o.addr}</p></div>
          <span style={{ fontSize: 11, fontWeight: 700, color: o.agreed ? "#22C55E" : "#EF4444" }}>{o.agreed ? "동의완료" : "미동의"}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 기타 서브 컴포넌트 ─── [cite: 196-289]
function StatCard({ label, value, sub, accent }) { return <div style={{ background: "#161618", padding: 16, borderRadius: 16, border: "1px solid #1E1E22" }}><p style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</p><p style={{ fontSize: 24, fontWeight: 800, color: accent, marginTop: 4 }}>{value}</p><p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{sub}</p></div>; }
function DonutCard({ title, percent, sub, color, gradStart }) {
  const data = [{ v: percent }, { v: 100 - percent }];
  return (
    <div style={{ background: "#161618", padding: 16, borderRadius: 16, border: "1px solid #1E1E22", textAlign: "center" }}>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>{title}</p>
      <div style={{ height: 100, position: "relative" }}>
        <ResponsiveContainer><PieChart><Pie data={data} innerRadius={35} outerRadius={45} dataKey="v" stroke="none"><Cell fill={color} /><Cell fill="#2A2A2E" /></Pie></PieChart></ResponsiveContainer>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}><p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{percent.toFixed(1)}%</p></div>
      </div>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>{sub}</p>
    </div>
  );
}
function CategoryView({ stats, catTab, setCatTab }) {
  const d = stats.byCategory[catTab];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: "flex", gap: 10, background: '#161618', padding: 4, borderRadius: 12 }}>{["공동주택", "단독/다가구", "상가/기타"].map(c => <button key={c} onClick={() => setCatTab(c)} style={{ flex: 1, padding: 10, background: catTab === c ? "#2A2A2E" : "none", color: "#fff", border: "none", borderRadius: 8, cursor: 'pointer' }}>{c}</button>)}</div>
      <div style={{ background: "#161618", padding: 20, borderRadius: 16, border: "1px solid #1E1E22" }}>
        <h3 style={{ fontSize: 18 }}>{catTab} 동의율: {(d.agreed/d.total*100).toFixed(1)}%</h3>
        <ProgressBar value={(d.agreed/d.total*100)} color="#FF2A55" />
      </div>
    </div>
  );
}
function ProgressBar({ value, color }) { return <div style={{ height: 6, background: "#2A2A2E", borderRadius: 3, marginTop: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${value}%`, background: color }} /></div>; }
function ResultRow({ label, value, sub, accent }) { return <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}><div><p style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</p></div><div style={{ textAlign: "right" }}><p style={{ fontSize: 16, fontWeight: 800, color: accent || "#E8E6E1" }}>{value}원</p><p style={{ fontSize: 10, color: "#9CA3AF" }}>약 {sub}</p></div></div>; }