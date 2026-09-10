import { LandTransaction, MouzaStats, KhatianStats } from '../types';

export interface DagSummary {
  mouza: string;
  khatianType: 'CS' | 'SA' | 'RS' | 'Namjari';
  khatianNo: string;
  dagType: 'CS' | 'SA' | 'RS' | 'Namjari';
  dagNo: string;
  purchased: number;
  sold: number;
  remaining: number;
  hasMismatch: boolean; // if sold > purchased
}

export interface KhatianSummary {
  mouza: string;
  khatianType: 'CS' | 'SA' | 'RS' | 'Namjari';
  khatianNo: string;
  purchased: number;
  sold: number;
  remaining: number;
  dagsCount: number;
}

export function getKhatianLabel(type: 'CS' | 'SA' | 'RS' | 'Namjari' | string): string {
  const labels: { [key: string]: string } = {
    CS: 'সি.এস',
    SA: 'এস.এ',
    RS: 'আর.এস',
    Namjari: 'নামজারী'
  };
  return labels[type] || type;
}

export function analyzeLandData(transactions: LandTransaction[]) {
  let totalPurchased = 0;
  let totalSold = 0;

  // Track mouzas stats
  const mouzaMap: { [key: string]: { purchased: number; sold: number; deeds: Set<string>; rsKhatians: Set<string>; namjariKhatians: Set<string>; rsDags: Set<string> } } = {};
  
  // Track dags: key is unique combination of mouza, khatianType, khatianNo, dagNo
  const dagMap: { [key: string]: DagSummary } = {};
  
  // Track khatians: key is mouza, khatianType, khatianNo
  const khatianMap: { [key: string]: KhatianSummary } = {};

  const rsDagMap: { [key: string]: { mouza: string; dagNo: string; purchased: number; sold: number; remaining: number } } = {};

  // Process all transactions
  transactions.forEach((tx) => {
    const isPurchase = tx.type === 'purchase';
    const amount = tx.transactionAmount || 0;
    
    if (isPurchase) {
      totalPurchased += amount;
    } else {
      totalSold += amount;
    }

    // Khatian & Dag detailed tracking
    tx.khatians.forEach((kh) => {
      const khatianMouza = kh.mouza?.trim() || tx.mouza;

      if (!mouzaMap[khatianMouza]) {
        mouzaMap[khatianMouza] = { purchased: 0, sold: 0, deeds: new Set(), rsKhatians: new Set(), namjariKhatians: new Set(), rsDags: new Set() };
      }
      mouzaMap[khatianMouza].deeds.add(tx.deedNumber);

      let khAmount = 0;
      kh.dags.forEach((dag) => {
        khAmount += (dag.amount || 0);

        // Track RS Dag mismatch separately
        if (dag.hasRS && dag.rsDag) {
           mouzaMap[khatianMouza].rsDags.add(dag.rsDag);
           const rsKey = `${khatianMouza}_${dag.rsDag}`;
           if (!rsDagMap[rsKey]) {
              rsDagMap[rsKey] = { mouza: khatianMouza, dagNo: dag.rsDag, purchased: 0, sold: 0, remaining: 0 };
           }
           const amt = dag.amount || 0;
           if (isPurchase) {
              rsDagMap[rsKey].purchased += amt;
           } else {
              rsDagMap[rsKey].sold += amt;
           }
        } else if (dag.rsDag) {
           // fallback if checkbox isn't checked but user typed RS Dag
           mouzaMap[khatianMouza].rsDags.add(dag.rsDag);
        }
      });

      if (isPurchase) {
        mouzaMap[khatianMouza].purchased += khAmount;
      } else {
        mouzaMap[khatianMouza].sold += khAmount;
      }

      // Find khatian numbers and types
      const kTypes: ('CS' | 'SA' | 'RS' | 'Namjari')[] = [];
      const kNames: string[] = [];
      
      if (kh.hasCS && kh.csKhatian) { kTypes.push('CS'); kNames.push(kh.csKhatian); }
      if (kh.hasSA && kh.saKhatian) { kTypes.push('SA'); kNames.push(kh.saKhatian); }
      if (kh.hasRS && kh.rsKhatian) { 
        kTypes.push('RS'); 
        kNames.push(kh.rsKhatian); 
        mouzaMap[khatianMouza].rsKhatians.add(kh.rsKhatian);
      }
      if (kh.hasNamjari && kh.namjariKhatian) { 
        kTypes.push('Namjari'); 
        kNames.push(kh.namjariKhatian); 
        mouzaMap[khatianMouza].namjariKhatians.add(kh.namjariKhatian);
      }
      
      // Default to what is present if checkboxes aren't check but they typed in them
      if (kTypes.length === 0) {
        if (kh.csKhatian) { kTypes.push('CS'); kNames.push(kh.csKhatian); }
        if (kh.saKhatian) { kTypes.push('SA'); kNames.push(kh.saKhatian); }
        if (kh.rsKhatian) { 
          kTypes.push('RS'); 
          kNames.push(kh.rsKhatian);
          mouzaMap[khatianMouza].rsKhatians.add(kh.rsKhatian);
        }
        if (kh.namjariKhatian) { 
          kTypes.push('Namjari'); 
          kNames.push(kh.namjariKhatian);
          mouzaMap[khatianMouza].namjariKhatians.add(kh.namjariKhatian);
        }
      }

      kTypes.forEach((kType, idx) => {
        const kNo = kNames[idx];
        if (!kNo) return;

        const kKey = `${khatianMouza}_${kType}_${kNo}`;
        if (!khatianMap[kKey]) {
          khatianMap[kKey] = {
            mouza: khatianMouza,
            khatianType: kType,
            khatianNo: kNo,
            purchased: 0,
            sold: 0,
            remaining: 0,
            dagsCount: kh.dags.length
          };
        }

        kh.dags.forEach((dag) => {
          const dTypes: ('CS' | 'SA' | 'RS' | 'Namjari')[] = [];
          const dNames: string[] = [];
          
          if (dag.hasCS && dag.csDag) { dTypes.push('CS'); dNames.push(dag.csDag); }
          if (dag.hasSA && dag.saDag) { dTypes.push('SA'); dNames.push(dag.saDag); }
          if (dag.hasRS && dag.rsDag) { dTypes.push('RS'); dNames.push(dag.rsDag); }

          if (dTypes.length === 0) {
            if (dag.csDag) { dTypes.push('CS'); dNames.push(dag.csDag); }
            if (dag.saDag) { dTypes.push('SA'); dNames.push(dag.saDag); }
            if (dag.rsDag) { dTypes.push('RS'); dNames.push(dag.rsDag); }
          }

          dTypes.forEach((dType, dIdx) => {
            const dNo = dNames[dIdx];
            if (!dNo) return;

            const dagKey = `${kKey}_${dType}_${dNo}`;
            if (!dagMap[dagKey]) {
              dagMap[dagKey] = {
                mouza: khatianMouza,
                khatianType: kType,
                khatianNo: kNo,
                dagType: dType,
                dagNo: dNo,
                purchased: 0,
                sold: 0,
                remaining: 0,
                hasMismatch: false
              };
            }

            const transAmount = dag.amount || 0;
            if (isPurchase) {
              dagMap[dagKey].purchased += transAmount;
              khatianMap[kKey].purchased += transAmount;
            } else {
              dagMap[dagKey].sold += transAmount;
              khatianMap[kKey].sold += transAmount;
            }
          });
        });
      });
    });
  });

  // Calculate remainders & check mismatches
  const dagsSummaryList = Object.values(dagMap).map((d) => {
    d.remaining = d.purchased - d.sold;
    d.hasMismatch = d.remaining < 0;
    return d;
  });

  const khatiansList = Object.values(khatianMap).map((k) => {
    k.remaining = k.purchased - k.sold;
    return k;
  });

  const mouzasList: MouzaStats[] = Object.keys(mouzaMap).map((mouzaName) => {
    const stats = mouzaMap[mouzaName];
    return {
      mouza: mouzaName,
      totalPurchase: stats.purchased,
      totalSale: stats.sold,
      remaining: stats.purchased - stats.sold,
      deedsCount: stats.deeds.size,
      totalRSKhatian: stats.rsKhatians.size,
      totalNamjariKhatian: stats.namjariKhatians.size,
      totalRSDag: stats.rsDags.size
    };
  });

  const mismatchAlerts = Object.values(rsDagMap)
    .map((d) => {
      d.remaining = d.purchased - d.sold;
      return d;
    })
    .filter((d) => d.remaining < 0)
    .map((d) => ({
      mouza: d.mouza,
      dagNo: d.dagNo,
      remaining: d.remaining
    }));

  return {
    totalPurchased,
    totalSold,
    totalRemaining: totalPurchased - totalSold,
    mouzasList,
    khatiansList,
    dagsSummaryList,
    mismatchAlerts
  };
}
