import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

// ─── Owner Data from Excel ───
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
  // Top Row
  "28-31": [[15, 0], [25, 0], [25, 15], [15, 15]],
  "28-8":  [[25, 0], [35, 0], [35, 15], [25, 15]],
  "28-7":  [[35, 0], [45, 0], [45, 15], [35, 15]],
  "28-6":  [[45, 0], [55, 0], [55, 15], [45, 15]],
  "28-5":  [[55, 0], [65, 0], [65, 15], [55, 15]],
  "28-4":  [[65, 0], [75, 0], [75, 15], [65, 15]],
  "28-3":  [[75, 0], [86, 0], [86, 15], [75, 15]],

  // Right Edge
  "28-2":  [[86, 0], [100, 0], [100, 26], [86, 26]],
  "28-1":  [[86, 26], [100, 26], [100, 45], [86, 45]],
  "28":    [[86, 45], [100, 45], [100, 60], [86, 60]],

  // Row 2
  "28-10": [[0, 15], [14, 15], [14, 26], [0, 26]],
  "28-11": [[14, 15], [28, 15], [28, 26], [14, 26]],
  "28-12": [[28, 15], [40, 15], [40, 26], [28, 26]],
  "28-13": [[40, 15], [50, 15], [50, 26], [40, 26]],
  "28-14": [[50, 15], [60, 15], [60, 26], [50, 26]],
  "28-35": [[60, 15], [70, 15], [70, 26], [60, 26]],
  "28-15": [[70, 15], [86, 15], [86, 26], [70, 26]],

  // Central Road 28-29
  "28-29": [[0, 26], [86, 26], [86, 30], [76, 30], [76, 60], [70, 60], [70, 30], [0, 30]],

  // Row 3
  "28-23": [[0, 30], [14, 30], [14, 45], [0, 45]],
  "28-21": [[14, 30], [28, 30], [28, 45], [14, 45]],
  "28-32": [[28, 30], [42, 30], [42, 45], [28, 45]],
  "28-19": [[42, 30], [56, 30], [56, 45], [42, 45]],
  "28-18": [[56, 30], [70, 30], [70, 45], [56, 45]],
  "28-34": [[76, 30], [86, 30], [86, 60], [76, 60]],

  // Bottom Row
  "28-24": [[0, 45], [22, 45], [22, 60], [0, 60]],
  "28-26": [[22, 45], [32, 45], [32, 60], [22, 60]],
  "28-27": [[32, 45], [42, 45], [42, 60], [32, 60]],
  "28-28": [[42, 45], [52, 45], [52, 60], [42, 60]],
  "28-36": [[52, 45], [61, 45], [61, 60], [52, 60]],
  "28-17": [[61, 45], [70, 45], [70, 60], [61, 60]]
};

const MANUAL_CENTERS = {
  "28-29": [35, 28],
};

const BASE_RED_BOUNDARY = [[15, 0], [100, 0], [100, 60], [0, 60], [0, 15], [15, 15], [15, 0]];

const OWNER_LOTS = {1:["28"],2:["28-1","28-34"],3:["28-1"],4:["28-1"],5:["28-1"],6:["28-1"],7:["28-1"],8:["28-1"],9:["28-1"],10:["28-1"],11:["28-2"],12:["28-2"],13:["28-2"],14:["28-2"],15:["28-2"],16:["28-2"],17:["28-2"],18:["28-2"],19:["28-2"],20:["28-3"],21:["28-3"],22:["28-3"],23:["28-3"],24:["28-3"],25:["28-3"],26:["28-3"],27:["28-3"],28:["28-4"],29:["28-5"],30:["28-5"],31:["28-5"],32:["28-5"],33:["28-5"],34:["28-5"],35:["28-5"],36:["28-5"],37:["28-6"],38:["28-6"],39:["28-6"],40:["28-6"],41:["28-6"],42:["28-6"],43:["28-6"],44:["28-6"],45:["28-6"],46:["28-6"],47:["28-6"],48:["28-7"],49:["28-8"],50:["28-10"],51:["28-11"],52:["28-11"],53:["28-11"],54:["28-11"],55:["28-11"],56:["28-11"],57:["28-11"],58:["28-11"],59:["28-12"],60:["28-13"],61:["28-14"],62:["28-15"],63:["28-15"],64:["28-15"],65:["28-15"],66:["28-15"],67:["28-15"],68:["28-15"],69:["28-15"],70:["28-15"],71:["28-17"],72:["28-18"],73:["28-19"],74:["28-21"],75:["28-21"],76:["28-21"],77:["28-21"],78:["28-21"],79:["28-21"],80:["28-21"],81:["28-21"],82:["28-21"],83:["28-21"],84:["28-21"],85:["28-21"],86:["28-23"],87:["28-24"],88:["28-26"],89:["28-27"],90:["28-28"],91:["28-29"],92:["28-31"],93:["28-32"],94:["28-32"],95:["28-32"],96:["28-32"],97:["28-32"],98:["28-32"],99:["28-35"],100:["28-36"]};

// ─── Authorized Users List ───
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
    if (!userId) {
      setErr("접속할 담당자를 선택해주세요.");
      return;
    }
    
    const user = AUTHORIZED_USERS.find(u => u.id === userId);
    if (pwd !== user.pin) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    onLogin(user.role === "담당" ? user.name : `${user.name} ${user.role}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0C0C0E", color: "#E8E6E1", fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ background: "#161618", padding: "32px 24px", borderRadius: 16, width: "90%", maxWidth: 360, border: "1px solid #2A2A2E", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>가로주택정비사업</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>현장지원 시스템 보안 로그인</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: "100%", padding: "14px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: userId ? "#fff" : "#9CA3AF", fontSize: 15, outline: "none", appearance: "none" }}
            >
              <option value="" disabled>담당자 선택</option>
              {AUTHORIZED_USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name} {u.role}</option>
              ))}
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <input
            type="password"
            placeholder="접속 비밀번호 (PIN)"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            style={{ padding: "14px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#fff", fontSize: 15, outline: "none", letterSpacing: 2 }}
          />
          {err && <p style={{ color: "#FF2A55", fontSize: 12, fontWeight: 700, margin: "4px 0" }}>{err}</p>}
          <button type="submit" className="btn-press" style={{ marginTop: 12, padding: "16px", background: "linear-gradient(135deg, #FF2A55, #C81A40)", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
            시스템 접속
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [owners, setOwners] = useState([]);
  const [view, setView] = useState("dash"); 
  const [selectedId, setSelectedId] = useState(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [catTab, setCatTab] = useState("공동주택");

  // 파이어베이스 실시간 데이터 가져오기
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "owners"), (snapshot) => {
      const ownerData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: Number(doc.id) // ID를 숫자로 변환
      }));
      
      if (ownerData.length === 0) {
        setOwners(RAW_OWNERS.map(o => ({ ...o, memoHistory: [], disposition: "", agreedBy: "" })));
      } else {
        setOwners(ownerData.sort((a, b) => Number(a.sn) - Number(b.sn)));
      }
    });

    return () => unsubscribe();
  }, []);

  // 데이터 수정 시 파이어베이스에 즉시 반영
  const updateOwner = useCallback(async (id, updates) => {
    try {
      setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      
      const ownerRef = doc(db, "owners", String(id));
      await updateDoc(ownerRef, updates);
    } catch (error) {
      console.error("데이터 업데이트 실패:", error);
    }
  }, []);

  // 초기 100명 데이터 동기화
  const syncInitialData = async () => {
    if (!window.confirm("데이터베이스 초기화를 진행할까요?")) return;
    try {
      const batch = writeBatch(db);
      RAW_OWNERS.forEach(o => {
        const docRef = doc(db, "owners", String(o.id));
        batch.set(docRef, { ...o, memoHistory: [], disposition: "", agreedBy: "" });
      });
      await batch.commit();
      alert("서버 동기화 성공!");
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
    const handleResize = () => {
      if (window.innerWidth >= 800 && view === "map") {
        setView("dash");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  const handleSelectLot = useCallback((id) => {
    if (view === "list") {
      setScrollPos(window.scrollY);
    }
    setSelectedId(id);
  }, [view]);

  const handleBack = useCallback(() => {
    setSelectedId(null);
    if (view === "list") {
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 0);
    }
  }, [scrollPos, view]);


  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const selected = selectedId != null ? owners.find(o => o.id === selectedId) : null;

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        body { background: #0C0C0E; margin: 0; font-family: 'Pretendard', sans-serif;}
        input, select, textarea { font-family: inherit; }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: inner-spin-button !important;
          opacity: 1 !important;
          display: inline-block !important;
          cursor: pointer;
          transform: scale(0.8);
          transform-origin: right center;
        }

        .popup-list::-webkit-scrollbar {
          display: block;
          width: 4px;
        }
        .popup-list::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }

        .app-wrapper {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        .left-pane {
          width: 100%;
          max-width: 480px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          background: #0C0C0E;
          z-index: 10;
          margin: 0 auto;
        }
        .right-pane {
          display: none;
          flex: 1;
          height: 100vh;
          background: #0a0a0a;
          border-left: 1px solid #1E1E22;
          padding: 24px;
          flex-direction: column;
        }
        .desktop-map-inner {
          flex: 1;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #2A2A2E;
          position: relative;
          background: #0a0a0a;
        }
        .mobile-map-inner {
          height: 480px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #2A2A2E;
          position: relative;
          background: #0a0a0a;
        }
        
        @media (min-width: 800px) {
          .left-pane {
            margin: 0;
            box-shadow: 5px 0 20px rgba(0,0,0,0.5);
          }
          .right-pane {
            display: flex;
          }
          .mobile-only-map {
            display: none !important;
          }
          .nav-btn-map {
            display: none !important;
          }
        }

        /* 버튼 및 카드 클릭 애니메이션 (Active Effect) */
        .btn-press {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.1s;
        }
        .btn-press:active {
          transform: scale(0.96);
          background-color: #1E1E22 !important;
        }
      `}</style>
      
      <div className="app-wrapper">
        <div className="left-pane">
          {selected ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <DetailView key={selected.id} owner={selected} onBack={handleBack} updateOwner={updateOwner} currentUser={currentUser} />
            </div>
          ) : (
            <>
              <header style={{ padding: "16px 20px 12px", background: "linear-gradient(180deg, #0C0C0E 0%, transparent 100%)", position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>송파구 문정동 28번지</p>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: "#E8E6E1", marginTop: 2 }}>가로주택정비사업</h1>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "#E8E6E1", fontWeight: 700 }}>{currentUser}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {currentUser === "시스템 관리자" && (
                          <button onClick={syncInitialData} className="btn-press" style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.3)", color: "#FFF", borderRadius: 6, padding: "3px 6px", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                            DB초기화
                          </button>
                        )}
                        <button onClick={() => setCurrentUser(null)} className="btn-press" style={{ background: "rgba(255, 42, 85, 0.1)", border: "1px solid rgba(255, 42, 85, 0.3)", color: "#FF2A55", borderRadius: 6, padding: "3px 6px", fontSize: 9, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                          <IconLock size={10} /> 잠금
                        </button>
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #FF2A55, #C81A40)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", boxShadow: "0 4px 12px rgba(255, 42, 85, 0.3)" }}>
                      {stats.agreed}
                    </div>
                  </div>
                </div>
              </header>

              <main style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>
                {view === "dash" && <Dashboard stats={stats} remainingOwner={remainingOwner} remainingArea={remainingArea} setView={setView} setFilter={setFilter} target={{ owner: targetOwner, area: targetArea }} />}
                {view === "cat" && <CategoryView stats={stats} catTab={catTab} setCatTab={setCatTab} />}
                {view === "map" && <div className="mobile-only-map"><InteractiveSvgMap owners={owners} onSelect={handleSelectLot} mapFilter={filter} setMapFilter={setFilter} stats={stats} isDesktop={false} /></div>}
                {view === "list" && <ListView owners={owners} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onSelect={handleSelectLot} stats={stats} />}
              </main>

              <nav style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(12,12,14,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid #1E1E22", display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 50 }}>
                {[
                  { key: "dash", icon: IconHome, label: "대시보드" },
                  { key: "map", icon: IconMap, label: "지적도" },
                  { key: "cat", icon: IconChart, label: "용도별" },
                  { key: "list", icon: IconUsers, label: "소유자" },
                ].map(t => (
                  <button 
  key={t.key} 
  className={t.key === 'map' ? 'nav-btn-map' : ''} 
  onClick={() => {
    setView(t.key);
    // 소유자 탭(list)으로 이동할 때만 검색어와 필터를 "전체"로 초기화
    if (t.key === "list") {
      setSearch("");
      setFilter("전체");
    }
  }} 
  style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: view === t.key ? "#FF2A55" : "#9CA3AF", transition: "color 0.2s", padding: "4px 16px" }}
>
  <t.icon size={22} />
  <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
</button>
                ))}
              </nav>
            </>
          )}
        </div>
        
        <div className="right-pane">
          <InteractiveSvgMap owners={owners} onSelect={handleSelectLot} mapFilter={filter} setMapFilter={setFilter} stats={stats} isDesktop={true} initialScale={0.8} />
        </div>
      </div>
    </>
  );
}

function InteractiveSvgMap({ owners, onSelect, mapFilter, setMapFilter, stats, isDesktop = false, initialScale = 0.45 }) {
  const containerRef = useRef(null);
  
  const [panZoom, setPanZoom] = useState({ x: 0, y: 0, scale: initialScale });
  const [selectedLot, setSelectedLot] = useState(null);
  const [catFilter, setCatFilter] = useState("전체");
  const [showIcons, setShowIcons] = useState(true);

  const dragRef = useRef({ 
    isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, pinchDist: 0, isMoved: false 
  });

  const lotData = useMemo(() => {
    const lots = {};
    Object.entries(BASE_POLYS).forEach(([jibun, p]) => {
      const ownersOnLot = owners.filter(o => (OWNER_LOTS[o.sn] || []).includes(jibun));
      const totalCount = ownersOnLot.length;
      const agreedCount = ownersOnLot.filter(o => o.agreed).length;
      
      let calculatedCenter;
      if (MANUAL_CENTERS[jibun]) {
        calculatedCenter = MANUAL_CENTERS[jibun];
      } else {
        let xSum = 0, ySum = 0;
        p.forEach(([x, y]) => { xSum += x; ySum += y; });
        calculatedCenter = [xSum / p.length, ySum / p.length];
      }

      const counts = {};
      ownersOnLot.forEach(o => { counts[o.cat] = (counts[o.cat] || 0) + 1; });
      let primaryCat = "기타";
      if (Object.keys(counts).length > 0) {
        primaryCat = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      }

      // 주소에서 건물명 추출 및 가공
      let displayName = jibun.replace("28-", ""); 
      if (ownersOnLot.length > 0 && ownersOnLot[0].addr) {
        const addrParts = ownersOnLot[0].addr.split(" ");
        if (addrParts.length >= 3) {
          let bldg = addrParts[2];
          if (!bldg.includes("호") && bldg !== "외" && isNaN(bldg[0])) {
            bldg = bldg.replace(/빌라|빌/g, "");
            if (bldg.startsWith("다세대")) {
              displayName = jibun + "다세대"; 
            } else {
              displayName = bldg; 
            }
          }
        }
      }

      lots[jibun] = {
        jibun, center: calculatedCenter, polygon: p, owners: ownersOnLot,
        totalCount, agreedCount, primaryCat,
        displayName,
        allAgreed: totalCount > 0 && agreedCount === totalCount,
        someAgreed: agreedCount > 0 && agreedCount < totalCount,
        noneAgreed: totalCount > 0 && agreedCount === 0,
        isEmpty: totalCount === 0,
      };
    });
    return lots;
  }, [owners]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const onWheel = (e) => {
      if (e.target.closest('.map-popup-content')) return;
      e.preventDefault();
      setPanZoom(prev => {
        const delta = e.deltaY * -0.0005; 
        const newScale = Math.min(Math.max(0.2, prev.scale + delta), 15);
        return { ...prev, scale: newScale };
      });
    };

    const onTouchMove = (e) => {
      if (e.target.closest('.map-popup-content')) return;
      e.preventDefault(); 
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (e.target?.closest && e.target.closest('.map-popup-content')) return;
    if (e.touches && e.touches.length === 2) {
      dragRef.current.pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragRef.current = { 
      ...dragRef.current, isDragging: true, startX: clientX, startY: clientY, initialX: panZoom.x, initialY: panZoom.y, isMoved: false 
    };
  };

  const handlePointerMove = (e) => {
    if (e.target?.closest && e.target.closest('.map-popup-content')) return;
    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (dragRef.current.pinchDist) {
        const delta = (dist - dragRef.current.pinchDist) * 0.002;
        setPanZoom(prev => ({ ...prev, scale: Math.min(Math.max(0.2, prev.scale + delta), 15) }));
      }
      dragRef.current.pinchDist = dist;
      dragRef.current.isDragging = false; 
      return;
    }

    if (!dragRef.current.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.isMoved = true;
    setPanZoom(prev => ({ ...prev, x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy }));
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.pinchDist = 0;
  };

  const handleLotClick = (lot, e) => {
    if (dragRef.current.isMoved) return;
    if (!lot.isEmpty) setSelectedLot(lot);

    if (containerRef.current && e) {
      const lotRect = e.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height * 0.65;

      const lotCenterX = lotRect.left + lotRect.width / 2;
      const lotCenterY = lotRect.top + lotRect.height / 2;

      const deltaX = containerCenterX - lotCenterX;
      const deltaY = containerCenterY - lotCenterY;

      setPanZoom(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  };

  const popupVisualScale = Math.min(Math.max(0.65 + 0.35 * panZoom.scale, 0.7), 1.5);
  const popupTransformScale = popupVisualScale / panZoom.scale;

  const MAP_W = 800;
  const MAP_H = 480;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isDesktop ? 16 : 10, marginTop: isDesktop ? 0 : -8, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 800 }}>지적도 기반 매핑 {isDesktop && " (전체 뷰)"}</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {["전체", "동의완료", "부분동의", "미동의"].map(f => (
            <button key={f} className="btn-press" onClick={() => setMapFilter(f)} style={{
              padding: "6px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              background: mapFilter === f ? (f === "동의완료" ? "#22C55E" : f === "미동의" ? "#EF4444" : f === "부분동의" ? "#EAB308" : "#FF2A55") : "#1E1E22",
              color: mapFilter === f ? (f === "부분동의" ? "#000" : "#fff") : "#9CA3AF",
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { id: "전체", label: "모든 용도" },
            { id: "단독/다가구", label: "🏠 단독" },
            { id: "공동주택", label: "🏢 공동" },
            { id: "상가/기타", label: "🏪 기타" }
          ].map(f => (
            <button key={f.id} className="btn-press" onClick={() => setCatFilter(f.id)} style={{
              padding: "5px 12px", borderRadius: 12, border: "1px solid #2A2A2E", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              background: catFilter === f.id ? "#3B82F6" : "transparent",
              color: catFilter === f.id ? "#fff" : "#9CA3AF",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
        className={isDesktop ? "desktop-map-inner" : "mobile-map-inner"}
      >
        <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", background: "#2A2A2E", borderRadius: 8, overflow: "hidden", zIndex: 10, border: "1px solid #3A3A40", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          <button className="btn-press" onClick={() => setPanZoom(p => ({ ...p, scale: Math.min(p.scale + 0.5, 15) }))} style={{ background: "none", border: "none", color: "#fff", padding: "8px 14px", fontSize: 18, cursor: "pointer" }}>＋</button>
          <div style={{ height: 1, background: "#3A3A40" }} />
          <button className="btn-press" onClick={() => setPanZoom(p => ({ ...p, scale: Math.max(p.scale - 0.5, 0.2) }))} style={{ background: "none", border: "none", color: "#fff", padding: "8px 14px", fontSize: 18, cursor: "pointer" }}>－</button>
        </div>

        <div style={{ 
          position: "absolute", top: '-50%', left: '-50%', width: "200%", height: "200%", 
          background: "repeating-linear-gradient(#222 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #222 0 1px, transparent 1px 100%)", 
          backgroundSize: "50px 50px", opacity: 0.5,
          transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`,
          transformOrigin: 'center', transition: dragRef.current.isDragging ? 'none' : 'transform 0.25s ease-out' 
        }} />

        <div style={{
          position: 'absolute', width: MAP_W, height: MAP_H, top: '50%', left: '50%',
          marginLeft: -MAP_W/2, marginTop: -MAP_H/2,
          transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`,
          transformOrigin: 'center center',
          transition: dragRef.current.isDragging ? 'none' : 'transform 0.25s ease-out'
        }}>
          <svg viewBox="-5 -5 110 70" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            
            <defs>
              <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {Object.values(lotData).map(lot => {
              const isStatusMatch = mapFilter === "전체" || 
                                   (mapFilter === "동의완료" && lot.allAgreed) ||
                                   (mapFilter === "미동의" && lot.noneAgreed && !lot.isEmpty) ||
                                   (mapFilter === "부분동의" && lot.someAgreed);
              const isCatMatch = catFilter === "전체" || lot.primaryCat === catFilter;
              
              const isHiddenByFilter = !isStatusMatch || !isCatMatch;
              const isSelected = selectedLot?.jibun === lot.jibun;
              
              let fillColor = "#1E1E22"; let fillOpacity = 0.6; let labelColor = "#6b7280"; let badgeColor = "#333";
              
              if (lot.isEmpty || isHiddenByFilter) {
                fillColor = "rgba(255,255,255,0.05)"; fillOpacity = 1; labelColor = "#555"; badgeColor = "#333";
              } else if (lot.allAgreed) {
                fillColor = "#22c55e"; fillOpacity = isSelected ? 0.7 : 0.4; labelColor = "#22c55e"; badgeColor = "#16a34a";
              } else if (lot.someAgreed) {
                fillColor = "#eab308"; fillOpacity = isSelected ? 0.65 : 0.35; labelColor = "#eab308"; badgeColor = "#ca8a04";
              } else {
                fillColor = "#ef4444"; fillOpacity = isSelected ? 0.5 : 0.2; labelColor = "#ef4444"; badgeColor = "#dc2626";
              }

              const strokeColor = isSelected && !lot.isEmpty && !isHiddenByFilter ? fillColor : (lot.isEmpty || isHiddenByFilter ? "#333" : "#4A4A55");
              const strokeWidth = isSelected && !lot.isEmpty && !isHiddenByFilter ? "0.6" : "0.2";
              
              const showIconNow = !lot.isEmpty && !isHiddenByFilter && showIcons;
              const iconSize = 4.0;
              const iconX = lot.center[0] - iconSize / 2;
              const iconY = lot.center[1] - 2.0; 
              
              const textY = showIconNow ? lot.center[1] - 3.5 : lot.center[1] - 0.5;
              const ratioY = showIconNow ? lot.center[1] + 3.0 : lot.center[1] + 1.5;

              return (
                <g key={lot.jibun} style={{ cursor: lot.isEmpty ? "default" : "pointer" }} onClick={(e) => handleLotClick(lot, e)}>
                  <polygon
                    points={lot.polygon.map(p => p.join(",")).join(" ")}
                    fill={fillColor} fillOpacity={fillOpacity}
                    stroke={strokeColor} strokeWidth={strokeWidth}
                    filter={isSelected && !lot.isEmpty && !isHiddenByFilter ? "url(#neon-glow)" : "none"}
                    style={{ transition: "fill-opacity 0.2s" }}
                  />

                  {isSelected && !lot.isEmpty && !isHiddenByFilter && (
                    <polygon points={lot.polygon.map(p => p.join(",")).join(" ")} fill="none" stroke="#ffffff" strokeWidth="0.3" pointerEvents="none" />
                  )}
                  
                  {lot.displayName !== lot.jibun.replace("28-", "") ? (
                    <>
                      <text 
                        x={lot.center[0]} y={textY - 1.6} 
                        fontSize="1.1" 
                        fill={isHiddenByFilter ? "#888" : "#60A5FA"} 
                        fontWeight="800" textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
                        style={{ textShadow: isHiddenByFilter ? "none" : "0px 1px 2px rgba(0,0,0,0.9)" }}
                      >
                        {lot.displayName}
                      </text>
                      <text 
                        x={lot.center[0]} y={textY + 0.4} 
                        fontSize={showIconNow ? "1.4" : "1.6"} 
                        fill={isHiddenByFilter ? "#888" : "#ffffff"} 
                        fontWeight="800" textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
                        style={{ textShadow: isHiddenByFilter ? "none" : "0px 1px 3px rgba(0,0,0,0.9)" }}
                      >
                        {lot.jibun.replace("28-", "")}
                      </text>
                    </>
                  ) : (
                    <text 
                      x={lot.center[0]} y={textY} 
                      fontSize={showIconNow ? "1.4" : "1.6"} 
                      fill={lot.isEmpty ? "#666" : (isHiddenByFilter ? "#888" : "#ffffff")} 
                      fontWeight="800" textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
                      style={{ textShadow: lot.isEmpty || isHiddenByFilter ? "none" : "0px 1px 3px rgba(0,0,0,0.9)" }}
                    >
                      {lot.jibun.replace("28-", "")}
                    </text>
                  )}

                  {showIconNow && (
                    <g transform={`translate(${iconX}, ${iconY}) scale(${iconSize / 24})`} style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}>
                      {lot.primaryCat === "단독/다가구" && (
                        <>
                          <rect x="4" y="10" width="16" height="12" rx="1" fill={badgeColor} stroke="#fff" strokeWidth="1.5" />
                          <polygon points="2,10 12,2 22,10" fill={badgeColor} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                        </>
                      )}
                      {lot.primaryCat === "공동주택" && (
                        <>
                          <rect x="4" y="4" width="16" height="18" rx="2" fill={badgeColor} stroke="#fff" strokeWidth="1.5" />
                          <rect x="8" y="8" width="3" height="3" fill="#fff" rx="0.5" />
                          <rect x="13" y="8" width="3" height="3" fill="#fff" rx="0.5" />
                          <rect x="8" y="14" width="3" height="3" fill="#fff" rx="0.5" />
                          <rect x="13" y="14" width="3" height="3" fill="#fff" rx="0.5" />
                        </>
                      )}
                      {lot.primaryCat === "상가/기타" && (
                        <>
                          <rect x="3" y="10" width="18" height="12" rx="1" fill={badgeColor} stroke="#fff" strokeWidth="1.5" />
                          <polygon points="2,10 4,4 20,4 22,10" fill={badgeColor} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                          <line x1="8" y1="10" x2="8" y2="15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="16" y1="10" x2="16" y2="15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        </>
                      )}
                    </g>
                  )}

                  {lot.isEmpty ? (
                    <text x={lot.center[0]} y={lot.center[1] + 1.8} fontSize="1.0" fill="#666" fontWeight="700" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">
                      (자료없음)
                    </text>
                  ) : (
                    <text 
                      x={lot.center[0]} y={ratioY} 
                      fontSize={showIconNow ? "1.6" : "1.8"} fill={labelColor} 
                      fontWeight="800" textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
                      style={{ textShadow: isHiddenByFilter ? "none" : "0px 1px 3px rgba(0,0,0,0.9)" }}
                    >
                      {lot.agreedCount}/{lot.totalCount}
                    </text>
                  )}
                </g>
              );
            })}

            <polygon points={BASE_RED_BOUNDARY.map(p => p.join(",")).join(" ")} fill="none" stroke="#FF2A55" strokeWidth="1.5" strokeOpacity="0.25" strokeLinejoin="round" pointerEvents="none" />
            <polygon points={BASE_RED_BOUNDARY.map(p => p.join(",")).join(" ")} fill="none" stroke="#FF1A45" strokeWidth="0.5" strokeDasharray="1.5, 1.5" strokeLinejoin="round" pointerEvents="none" />
          </svg>

          {selectedLot && (
            <div style={{
              position: "absolute",
              left: `${((selectedLot.center[0] + 5) / 110) * 100}%`,
              top: `${((selectedLot.center[1] + 5) / 70) * 100}%`,
              width: 0, height: 0, zIndex: 100
            }}>
              <div 
                className="map-popup-content"
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                style={{
                  position: "absolute", left: "50%",
                  transform: `translate(-50%, -100%) scale(${popupTransformScale})`,
                  marginTop: `${-12 * popupTransformScale}px`, 
                  transformOrigin: "bottom center",
                  background: "#fff", color: "#111", borderRadius: 16, padding: "16px", width: 230,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  pointerEvents: "auto", cursor: "default",
                  touchAction: "auto",
                  overscrollBehavior: "contain"
                }}
              >
                <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #fff" }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center" }}>
                      문정동 {selectedLot.jibun}
                      {selectedLot.displayName !== selectedLot.jibun.replace("28-", "") && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginLeft: 6, background: "rgba(59, 130, 246, 0.1)", padding: "2px 6px", borderRadius: "6px" }}>
                          {selectedLot.displayName}
                        </span>
                      )}
                    </h3>
                    <div style={{ display: "inline-block", background: selectedLot.allAgreed ? "#D1FAE5" : "#FFE4E6", color: selectedLot.allAgreed ? "#059669" : "#E11D48", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                      동의 {selectedLot.agreedCount}/{selectedLot.totalCount}명
                    </div>
                  </div>
                  <button onClick={() => setSelectedLot(null)} className="btn-press" style={{ background: "none", border: "none", fontSize: 18, fontWeight: 700, color: "#9CA3AF", cursor: "pointer", padding: 0 }}>✕</button>
                </div>

                <ul className="popup-list map-popup-content" style={{ listStyle: "none", padding: "0 4px", margin: "16px -4px 0 -4px", maxHeight: 280, overflowY: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
                  {selectedLot.owners.map(o => {
                    const unit = extractUnit(o.addr, o.cat);
                    return (
                      <li key={o.id} onClick={(e) => { e.stopPropagation(); setSelectedLot(null); onSelect(o.id); }} className="btn-press" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f3f4f6", cursor: "pointer" }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{o.nm}</span>
                          {unit && <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", marginLeft: 6 }}>{unit}</span>}
                          <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>#{o.sn}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: o.agreed ? "#D1FAE5" : "#FFE4E6", color: o.agreed ? "#059669" : "#E11D48" }}>
                          {o.agreed ? "동의" : "미동"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Dashboard({ stats, remainingOwner, remainingArea, setView, setFilter, target }) {
  const ownerData = [{ v: stats.ownerRate }, { v: 100 - stats.ownerRate }];
  const areaData = [{ v: stats.areaRate }, { v: 100 - stats.areaRate }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard label="전체 소유자" value={`${stats.total}명`} sub={`동의 ${stats.agreed}명`} accent="#FF2A55" />
        <StatCard label="오늘 동의" value={`+${stats.todayCount}건`} sub={new Date().toLocaleDateString("ko")} accent="#5BA87F" onClick={() => { setFilter("오늘"); setView("list"); }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DonutCard 
          title="소유자 동의율" 
          percent={stats.ownerRate} 
          data={ownerData} 
          target={target.owner} 
          sub={`${stats.agreed}/${stats.total}명`} 
          color="#FF2A55" 
          gradStart="#FF8A00"
          remainingText={stats.ownerRate >= target.owner ? "달성 완료" : `-${remainingOwner}명`}
        />
        <DonutCard 
          title="면적 동의율" 
          percent={stats.areaRate} 
          data={areaData} 
          target={target.area} 
          sub={`${fmtNum(stats.agreedArea)}/${fmtNum(stats.totalArea)}㎡`} 
          color="#5BA87F" 
          gradStart="#00E676"
          remainingText={stats.areaRate >= target.area ? "달성 완료" : `-${fmtNum(remainingArea)}㎡`}
        />
      </div>

      <div style={{ background: "#161618", borderRadius: 16, padding: "20px 16px", border: "1px solid #1E1E22" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>목표 달성까지</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#FF2A55", marginTop: 4 }}>{remainingOwner}<span style={{ fontSize: 14, color: "#9CA3AF" }}>명</span></p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>소유자 {target.owner}% 요건</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginTop: 2 }}>면적 {target.area}% 요건</p>
          </div>
        </div>
        <div style={{ marginTop: 12, height: 6, background: "#2A2A2E", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, stats.ownerRate)}%`, background: "linear-gradient(90deg, #FF8A00, #FF2A55)", borderRadius: 3, transition: "width 0.8s ease" }} />
        </div>
      </div>

      <div style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 12, letterSpacing: 1 }}>용도별 현황</p>
        {["공동주택", "단독/다가구", "상가/기타"].map(c => {
          const d = stats.byCategory[c];
          const rate = d.total ? (d.agreed / d.total * 100) : 0;
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E1E22" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c === "공동주택" ? "#FF2A55" : c === "단독/다가구" ? "#5BA87F" : "#7B8CDE" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#E8E6E1" }}>{c}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{d.total}명</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#FF2A55" }}>{rate.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => setView("cat")} className="btn-press" style={{ background: "#161618", border: "1px solid #1E1E22", borderRadius: 14, padding: 16, cursor: "pointer", textAlign: "left", color: "#E8E6E1" }}>
          <IconChart size={20} className="" />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#E8E6E1", marginTop: 8 }}>용도별 분석</p>
        </button>
        <button onClick={() => setView("list")} className="btn-press" style={{ background: "#161618", border: "1px solid #1E1E22", borderRadius: 14, padding: 16, cursor: "pointer", textAlign: "left", color: "#E8E6E1" }}>
          <IconUsers size={20} className="" />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#E8E6E1", marginTop: 8 }}>소유자 명부</p>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, onClick }) {
  return (
    <div onClick={onClick} className={onClick ? "btn-press" : ""} style={{ background: "#161618", borderRadius: 16, padding: "16px 14px", border: "1px solid #1E1E22", cursor: onClick ? "pointer" : "default" }}>
      <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: accent, marginTop: 4 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sub}</p>
    </div>
  );
}

function DonutCard({ title, percent, data, target, sub, color, gradStart, remainingText }) {
  const gradId = `grad-${title.replace(/\s/g, '')}`;
  return (
    <div style={{ background: "#161618", borderRadius: 16, padding: "16px 10px", border: "1px solid #1E1E22", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8 }}>{title}</p>
      <div style={{ position: "relative", width: 110, height: 110 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={50} startAngle={90} endAngle={-270} dataKey="v" stroke="none">
              <Cell fill={`url(#${gradId})`} />
              <Cell fill="#2A2A2E" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", width: "100%" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#E8E6E1", lineHeight: 1 }}>{percent.toFixed(1)}<span style={{ fontSize: 10 }}>%</span></p>
          {remainingText && <p style={{ fontSize: 9, color: color, marginTop: 4, fontWeight: 700, background: "rgba(255,255,255,0.05)", padding: "2px 4px", borderRadius: 4, display: "inline-block" }}>{remainingText}</p>}
        </div>
      </div>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>{sub}</p>
      <p style={{ fontSize: 9, color: "#A1A1AA", marginTop: 2 }}>목표 {target}%</p>
    </div>
  );
}

function CategoryView({ stats, catTab, setCatTab }) {
  const cats = ["공동주택", "단독/다가구", "상가/기타"];
  const colors = { "공동주택": "#FF2A55", "단독/다가구": "#5BA87F", "상가/기타": "#7B8CDE" };
  const d = stats.byCategory[catTab];
  const rate = d.total ? (d.agreed / d.total * 100) : 0;
  const areaRate = d.totalArea ? (d.agreedArea / d.totalArea * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>용도별 동의 현황</h2>
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>토지조서 기반 실시간 분석</p>

      <div style={{ display: "flex", background: "#161618", borderRadius: 12, padding: 3, border: "1px solid #1E1E22" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatTab(c)} className="btn-press" style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: catTab === c ? "#2A2A2E" : "transparent", color: catTab === c ? colors[c] : "#9CA3AF", transition: "all 0.2s" }}>{c}</button>
        ))}
      </div>

      <div style={{ background: "#161618", borderRadius: 16, padding: 20, border: "1px solid #1E1E22" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>소유자 동의율</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: colors[catTab] }}>{rate.toFixed(1)}%</p>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>{d.agreed} / {d.total}명</p>
        </div>
        <ProgressBar value={rate} color={colors[catTab]} />

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1E1E22" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>면적 동의율</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#E8E6E1" }}>{areaRate.toFixed(1)}%</p>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtNum(d.agreedArea)} / {fmtNum(d.totalArea)}㎡</p>
          </div>
          <ProgressBar value={areaRate} color="#9CA3AF" />
        </div>
      </div>

      <div style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 12 }}>유형별 비교</p>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "8px 12px", fontSize: 11, fontWeight: 600 }}>
          <span style={{ color: "#9CA3AF" }}>구분</span>
          <span style={{ color: "#9CA3AF", textAlign: "right" }}>소유자</span>
          <span style={{ color: "#9CA3AF", textAlign: "right" }}>면적</span>
          <span style={{ color: "#9CA3AF", textAlign: "right" }}>동의율</span>
          {cats.map(c => {
            const dd = stats.byCategory[c];
            const r = dd.total ? (dd.agreed / dd.total * 100).toFixed(1) : "0.0";
            return [
              <span key={c + "n"} style={{ color: colors[c], fontWeight: 700 }}>{c}</span>,
              <span key={c + "o"} style={{ textAlign: "right", color: "#E8E6E1" }}>{dd.total}명</span>,
              <span key={c + "a"} style={{ textAlign: "right", color: "#A1A1AA" }}>{fmtNum(dd.totalArea)}㎡</span>,
              <span key={c + "r"} style={{ textAlign: "right", color: colors[c], fontWeight: 700 }}>{r}%</span>,
            ];
          })}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 6, background: "#2A2A2E", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

function ListView({ owners, filter, setFilter, search, setSearch, onSelect, stats }) {
  const today = new Date().toISOString().split("T")[0];
  const filtered = useMemo(() => {
    return owners.filter(o => {
      const matchSearch = !search || o.nm.includes(search) || o.addr.includes(search) || String(o.sn) === search;
      if (!matchSearch) return false;
      if (filter === "전체") return true;
      if (filter === "오늘") return o.consentDate === today;
      if (filter === "동의완료") return o.agreed;
      if (filter === "미동의") return !o.agreed;
      return true;
    });
  }, [owners, filter, search, today]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>소유자 명부</h2>

      <div style={{ position: "relative" }}>
        <IconSearch size={18} className="" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 지번, 연번 검색" style={{ width: "100%", padding: "12px 12px 12px 40px", background: "#161618", border: "1px solid #1E1E22", borderRadius: 12, color: "#E8E6E1", fontSize: 13, outline: "none" }} />
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div style={{ display: "flex", gap: 6, overflow: "auto" }}>
        {["전체", "미동의", "동의완료", "오늘"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn-press" style={{ padding: "8px 16px", borderRadius: 20, border: filter === f ? "none" : "1px solid #2A2A2E", background: filter === f ? "#FF2A55" : "transparent", color: filter === f ? "#fff" : "#9CA3AF", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <MiniStat label="전체" value={`${stats.total}명`} />
        <MiniStat label="동의" value={`${stats.agreed}명`} accent />
        <MiniStat label="미동의" value={`${stats.total - stats.agreed}명`} />
      </div>

      <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>검색결과 {filtered.length}명</p>
      
      {filtered.map(o => {
        const unit = extractUnit(o.addr, o.cat);
        return (
          <div key={o.id} onClick={() => onSelect(o.id)} className="btn-press" style={{ background: "#161618", borderRadius: 14, padding: "14px 16px", border: "1px solid #1E1E22", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#E8E6E1" }}>{o.nm}</span>
                {unit && <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>{unit}</span>}
                <span style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 600 }}>#{o.sn}</span>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.addr}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "#A1A1AA" }}>
                <span>{o.tp}</span>
                <span>{o.area}㎡</span>
                {o.residing && <span style={{ color: "#5BA87F" }}>거주중</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: o.agreed ? "rgba(34, 197, 94, 0.2)" : "#2A2A2E", color: o.agreed ? "#22C55E" : "#9CA3AF" }}>{o.agreed ? "동의완료" : "미동의"}</span>
              
              {/* 서류 상태 뱃지: 동의 완료자에게만 서류 미비/완비 상태 직관적 표시 */}
              {o.agreed && (
                o.idCopy && o.privacyConsent ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" }}>📄 서류완비</span>
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255, 138, 0, 0.15)", color: "#FF8A00" }}>⚠️ 서류미비</span>
                )
              )}

              {o.memoHistory && o.memoHistory.length > 0 && <span style={{ fontSize: 9, color: "#7B8CDE", marginTop: 1 }}>메모 {o.memoHistory.length}건</span>}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40, fontSize: 13 }}>검색 결과가 없습니다</p>}
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, background: "#161618", borderRadius: 10, padding: "10px 12px", border: "1px solid #1E1E22" }}>
      <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: accent ? "#FF2A55" : "#E8E6E1", marginTop: 2 }}>{value}</p>
    </div>
  );
}

function DetailView({ owner, onBack, updateOwner, currentUser }) {
  const [assetStr, setAssetStr] = useState(String(owner.asset));
  const [ratio, setRatio] = useState(RATIO);
  const [marketPP, setMarketPP] = useState(6000);
  const [optIdx, setOptIdx] = useState(0);
  const [disposition, setDisposition] = useState(owner.disposition || "");
  const [newMemo, setNewMemo] = useState("");

  const asset = Number(assetStr.replace(/[^0-9]/g, "")) || 0;
  const rights = Math.floor(asset * ratio / 100);

  const options = useMemo(() => {
    const prices = { "46": PRICE_46, "59": PRICE_59, "84": PRICE_84 };
    const areas = { "46": AREA_46, "59": AREA_59, "84": AREA_84 };
    const combos = [["46", "46"], ["46", "59"], ["59", "59"], ["46", "84"], ["59", "84"]];
    
    const affordable = combos.filter(c => asset >= prices[c[0]] + prices[c[1]]);

    let result = [];
    if (affordable.length > 0) {
      affordable.slice(-2).reverse().forEach(c => {
        result.push({
          label: `${c[0]}타입 + ${c[1]}타입`,
          price: prices[c[0]] + prices[c[1]],
          pyeong: areas[c[0]] + areas[c[1]],
        });
      });
    } else {
      if (asset < PRICE_46) result = [{ label: "46타입", price: PRICE_46, pyeong: AREA_46 }];
      else if (asset < PRICE_59) result = [{ label: "46타입", price: PRICE_46, pyeong: AREA_46 }, { label: "59타입", price: PRICE_59, pyeong: AREA_59 }];
      else if (asset < PRICE_84) result = [{ label: "59타입", price: PRICE_59, pyeong: AREA_59 }, { label: "84타입", price: PRICE_84, pyeong: AREA_84 }];
      else result = [{ label: "84타입", price: PRICE_84, pyeong: AREA_84 }];
    }
    return result;
  }, [asset]);

  const safeIdx = optIdx < options.length ? optIdx : 0;
  const opt = options[safeIdx];
  const contribution = opt.price - rights;
  const marketVal = Math.floor(opt.pyeong * marketPP * 10000);
  const premium = marketVal - opt.price;
  const totalGain = marketVal - (asset + Math.max(0, contribution));
  const gainRate = asset > 0 ? (totalGain / asset * 100).toFixed(1) : "0";

  const toggleAgree = (agreed) => {
    updateOwner(owner.id, {
      agreed,
      consentDate: agreed ? new Date().toISOString().split("T")[0] : null,
      agreedBy: agreed ? currentUser : "",
      disposition,
    });
  };

  // [추가된 로직] 필수 서류(신분증, 개인정보) O/X 상태 업데이트 함수
  const toggleDoc = (docType, status) => {
    updateOwner(owner.id, { [docType]: status });
  };

  const handleSaveDisposition = (val) => {
// ...
    setDisposition(val);
    updateOwner(owner.id, { disposition: val });
  };

  const handleAddMemo = () => {
    if (!newMemo.trim()) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const updatedHistory = [...(owner.memoHistory || []), { id: Date.now(), date: dateStr, author: currentUser, text: newMemo }];
    updateOwner(owner.id, { memoHistory: updatedHistory });
    setNewMemo("");
  };

  return (
    <div style={{ width: "100%", fontFamily: "'Pretendard', -apple-system, sans-serif", background: "#0C0C0E", color: "#E8E6E1", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <header style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "#0C0C0E", zIndex: 50, borderBottom: "1px solid #1E1E22" }}>
        <button onClick={onBack} className="btn-press" style={{ background: "none", border: "none", color: "#E8E6E1", cursor: "pointer", padding: 4 }}>
          <IconBack size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800 }}>{owner.nm}</h1>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>연번 #{owner.sn}</p>
        </div>
      </header>

      <div style={{ padding: "12px 16px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        <section style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InfoCell label="물건 소재지" value={owner.addr} span />
            <InfoCell label="자산 유형" value={owner.tp} />
            <InfoCell label="대지면적" value={owner.area ? `${owner.area}㎡` : "-"} />
            <InfoCell label="전유면적" value={owner.privateArea ? `${owner.privateArea}㎡` : "-"} />
            <InfoCell label="거주여부" value={owner.residing ? "거주중" : "비거주"} />
            <InfoCell label="연령대" value={owner.age || "-"} />
          </div>
        </section>

        <section style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 1. 조합설립 동의 여부 */}
          <div>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>조합설립 동의 여부</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => toggleAgree(true)} className="btn-press" style={{ padding: 14, borderRadius: 12, border: owner.agreed ? "2px solid #5BA87F" : "1px solid #2A2A2E", background: owner.agreed ? "#1A2F1E" : "transparent", color: owner.agreed ? "#5BA87F" : "#9CA3AF", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span>✓ 동의 완료</span>
                {owner.agreed && <span style={{ fontSize: 10, color: "#5BA87F", fontWeight: 600 }}>담당: {owner.agreedBy || currentUser}</span>}
              </button>
              <button onClick={() => toggleAgree(false)} className="btn-press" style={{ padding: 14, borderRadius: 12, border: !owner.agreed ? "2px solid #E05252" : "1px solid #2A2A2E", background: !owner.agreed ? "#2F1A1A" : "transparent", color: !owner.agreed ? "#E05252" : "#9CA3AF", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                미동의
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: "#1E1E22" }} />

          {/* 2. 필수 서류 제출 확인 */}
          <div>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>필수 서류 제출 확인</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1A1A1E", padding: "10px 14px", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#E8E6E1", fontWeight: 700 }}>신분증 사본</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleDoc('idCopy', true)} className="btn-press" style={{ padding: "6px 18px", borderRadius: 8, border: owner.idCopy ? "2px solid #5BA87F" : "1px solid #2A2A2E", background: owner.idCopy ? "rgba(91, 168, 127, 0.15)" : "transparent", color: owner.idCopy ? "#5BA87F" : "#9CA3AF", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>O</button>
                  <button onClick={() => toggleDoc('idCopy', false)} className="btn-press" style={{ padding: "6px 18px", borderRadius: 8, border: owner.idCopy === false ? "2px solid #E05252" : "1px solid #2A2A2E", background: owner.idCopy === false ? "rgba(224, 82, 82, 0.15)" : "transparent", color: owner.idCopy === false ? "#E05252" : "#9CA3AF", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>X</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1A1A1E", padding: "10px 14px", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#E8E6E1", fontWeight: 700 }}>개인정보동의서</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleDoc('privacyConsent', true)} className="btn-press" style={{ padding: "6px 18px", borderRadius: 8, border: owner.privacyConsent ? "2px solid #5BA87F" : "1px solid #2A2A2E", background: owner.privacyConsent ? "rgba(91, 168, 127, 0.15)" : "transparent", color: owner.privacyConsent ? "#5BA87F" : "#9CA3AF", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>O</button>
                  <button onClick={() => toggleDoc('privacyConsent', false)} className="btn-press" style={{ padding: "6px 18px", borderRadius: 8, border: owner.privacyConsent === false ? "2px solid #E05252" : "1px solid #2A2A2E", background: owner.privacyConsent === false ? "rgba(224, 82, 82, 0.15)" : "transparent", color: owner.privacyConsent === false ? "#E05252" : "#9CA3AF", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>X</button>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, background: "#FF2A55", borderRadius: 2 }} />
            <p style={{ fontSize: 14, fontWeight: 700 }}>분담금 시뮬레이션</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <InputRow label="종전자산 추정가액 (A)" value={Number(assetStr.replace(/[^0-9]/g, "")).toLocaleString()} onChange={e => setAssetStr(e.target.value.replace(/[^0-9]/g, ""))} suffix="원" note={fmt(asset)} />
            <InputRow label="추정 비례율 (B)" value={ratio} step="0.01" onChange={e => setRatio(Number(e.target.value) || 0)} suffix="%" type="number" />
          </div>

          <div style={{ marginTop: 16, background: "#1E1E22", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>계산된 권리가액 (C = A × B)</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#FF2A55", marginTop: 4 }}>{fmtNum(rights)}<span style={{ fontSize: 12, color: "#9CA3AF" }}> 원</span></p>
            <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>약 {fmt(rights)}</p>
          </div>
        </section>

        <section style={{ background: "#161618", borderRadius: 16, overflow: "hidden", border: "1px solid #1E1E22" }}>
          <div style={{ background: "#1A1A1E", padding: "14px 16px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#FF2A55" }}>{opt.label}</p>
            {options.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {options.map((o, i) => (
                  <button key={i} onClick={() => setOptIdx(i)} className="btn-press" style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", background: safeIdx === i ? "#FF2A55" : "#2A2A2E", color: safeIdx === i ? "#fff" : "#9CA3AF" }}>{o.label}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <ResultRow label="조합원 분양가 (D)" value={fmtNum(opt.price)} sub={fmt(opt.price)} note={`${opt.label} 기준`} />
            <div style={{ height: 1, background: "#1E1E22" }} />
            <ResultRow label={contribution > 0 ? "추정 분담금 (D-C)" : "추정 환급금 (C-D)"} value={(contribution > 0 ? "" : "-") + fmtNum(Math.abs(contribution))} sub={fmt(contribution)} accent={contribution > 0 ? "#E05252" : "#5BA87F"} />
            <div style={{ height: 1, background: "#1E1E22" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>예상 입주 시세 (E)</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#A1A1AA" }}>평당</span>
                  <input type="number" step="100" value={marketPP} onChange={e => setMarketPP(Number(e.target.value))} style={{ width: 70, padding: "4px 8px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 6, color: "#E8E6E1", fontSize: 12, textAlign: "right", outline: "none" }} />
                  <span style={{ fontSize: 10, color: "#A1A1AA" }}>만원</span>
                </div>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#E8E6E1" }}>{fmtNum(marketVal)}<span style={{ fontSize: 11, color: "#9CA3AF" }}> 원</span></p>
              <p style={{ fontSize: 11, color: "#A1A1AA" }}>약 {fmt(marketVal)}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#1E1E22", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 10, color: "#5BA87F", fontWeight: 700, marginBottom: 4 }}>프리미엄 수익</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#E8E6E1" }}>{fmt(premium)}</p>
              </div>
              <div style={{ background: "#1E1E22", borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 10, color: "#7B8CDE", fontWeight: 700, marginBottom: 4 }}>총 자산상승</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#E8E6E1" }}>{fmt(totalGain)}</p>
                <p style={{ fontSize: 11, color: "#7B8CDE", fontWeight: 700, marginTop: 2 }}>+{gainRate}%</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 24, height: 160, padding: "0 16px", background: "#1A1A1E", borderRadius: 12, paddingTop: 16, paddingBottom: 12 }}>
              <BarCol label="종전가액" value={asset} max={marketVal} color="#9CA3AF" />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#7B8CDE" }}>+{gainRate}%</p>
                <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{fmt(totalGain)}</p>
              </div>
              <BarCol label="예상시세" value={marketVal} max={marketVal} color="#5BA87F" />
            </div>
          </div>
        </section>

        <section style={{ background: "#161618", borderRadius: 16, padding: 16, border: "1px solid #1E1E22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: "#7B8CDE", borderRadius: 2 }} />
            <p style={{ fontSize: 14, fontWeight: 700 }}>상담 메모</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 6 }}>소유주 성향</p>
            <div style={{ position: "relative" }}>
              <select value={disposition} onChange={e => handleSaveDisposition(e.target.value)} style={{ width: "100%", padding: "12px 40px 12px 12px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#E8E6E1", fontSize: 13, outline: "none", appearance: "none" }}>
                <option value="">특이사항 없음</option>
                <option value="positive">우호적 (적극참여)</option>
                <option value="neutral">중립적 (관망)</option>
                <option value="negative">반대/부정적 (설득필요)</option>
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 6 }}>상담 기록</p>
            
            {/* 누적된 메모 히스토리 렌더링 */}
            {owner.memoHistory && owner.memoHistory.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 200, overflowY: "auto" }}>
                {owner.memoHistory.map(m => (
                  <div key={m.id} style={{ background: "#2A2A2E", padding: "12px", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{m.date}</p>
                      <p style={{ fontSize: 10, color: "#7B8CDE", fontWeight: 700 }}>{m.author}</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#E8E6E1", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{m.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 새 메모 입력 및 등록 */}
            <div style={{ position: "relative" }}>
              <textarea 
                value={newMemo} 
                onChange={e => setNewMemo(e.target.value)} 
                placeholder="새로운 상담 내용을 입력하세요" 
                style={{ width: "100%", height: 80, padding: 12, paddingBottom: 40, background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#E8E6E1", fontSize: 13, outline: "none", resize: "none" }} 
              />
              <button 
                onClick={handleAddMemo}
                className="btn-press"
                style={{ position: "absolute", right: 8, bottom: 12, background: "#FF2A55", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                기록 추가
              </button>
            </div>
          </div>
        </section>

        <button onClick={onBack} className="btn-press" style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF2A55, #C81A40)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          ← 목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

function InfoCell({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#E8E6E1" }}>{value || "-"}</p>
    </div>
  );
}

function InputRow({ label, value, onChange, suffix, note, type = "text", step }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 6 }}>{label}</p>
      <div style={{ position: "relative" }}>
        <input type={type} step={step} value={value} onChange={onChange} style={{ width: "100%", padding: "12px 40px 12px 12px", background: "#1E1E22", border: "1px solid #2A2A2E", borderRadius: 10, color: "#E8E6E1", fontSize: 15, fontWeight: 700, textAlign: "right", outline: "none" }} />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 12 }}>{suffix}</span>
      </div>
      {note && <p style={{ fontSize: 10, color: "#C8956C", textAlign: "right", marginTop: 3 }}>{note}</p>}
    </div>
  );
}

function ResultRow({ label, value, sub, note, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>{label}</p>
        {note && <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>{note}</p>}
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: accent || "#E8E6E1" }}>{value}<span style={{ fontSize: 11, color: "#9CA3AF" }}> 원</span></p>
        <p style={{ fontSize: 10, color: "#A1A1AA" }}>약 {sub}</p>
      </div>
    </div>
  );
}

function BarCol({ label, value, max, color }) {
  const h = max > 0 ? Math.max(20, (value / max) * 100) : 20;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "0 0 50px" }}>
      <div style={{ width: 36, background: "#2A2A2E", borderRadius: "6px 6px 0 0", height: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        <div style={{ height: `${h}%`, background: color, borderRadius: "6px 6px 0 0", transition: "height 0.6s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
        </div>
      </div>
      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textAlign: "center" }}>{label}</p>
      <p style={{ fontSize: 9, color, fontWeight: 700 }}>{fmt(value)}</p>
    </div>
  );
}