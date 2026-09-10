import { LandTransaction, GlobalFilterState, DagInfo, KhatianInfo } from '../types';

export const getKhatianLabel = (k: KhatianInfo) => {
  return [
    k.csKhatian ? `সি.এস: ${k.csKhatian}` : null,
    k.saKhatian ? `এস.এ: ${k.saKhatian}` : null,
    k.rsKhatian ? `আর.এস: ${k.rsKhatian}` : null,
    k.namjariKhatian ? `নামজারী: ${k.namjariKhatian}` : null,
  ].filter(Boolean).join(', ');
};

export const getDagLabel = (d: DagInfo) => {
  return [
    d.csDag ? `সি.এস: ${d.csDag}` : null,
    d.saDag ? `এস.এ: ${d.saDag}` : null,
    d.rsDag ? `আর.এস: ${d.rsDag}` : null,
  ].filter(Boolean).join(', ');
};

/**
 * Checks if a specific dag matches the current filter hierarchy
 */
export const isDagMatchingFilter = (
  txMouza: string, 
  kh: KhatianInfo, 
  d: DagInfo, 
  filter: GlobalFilterState
) => {
  if (filter.mouza && txMouza !== filter.mouza) return false;
  if (filter.khatian && getKhatianLabel(kh) !== filter.khatian) return false;
  if (filter.dag && getDagLabel(d) !== filter.dag) return false;
  return true;
};

/**
 * Filter transactions based on the selected Mouza, Khatian, and Dag
 * Returns transactions that contain AT LEAST ONE dag matching the filter.
 */
export const filterTransactionsByHierarchy = (
  transactions: LandTransaction[],
  filter: GlobalFilterState
): LandTransaction[] => {
  if (!filter.mouza && !filter.khatian && !filter.dag) {
    return transactions;
  }

  return transactions.filter(tx => {
    return tx.khatians.some(kh => {
      const actualMouza = kh.mouza?.trim() || tx.mouza;
      return kh.dags.some(d => isDagMatchingFilter(actualMouza, kh, d, filter));
    });
  });
};

/**
 * Calculates total purchased and total sold for the exact matched items.
 * Only sums the `amount` of the Dags that explicitly match the filter hierarchy.
 */
export const calculateFilteredSummary = (
  transactions: LandTransaction[],
  filter: GlobalFilterState
) => {
  let totalPurchased = 0;
  let totalSold = 0;

  // If no filter is applied, return full totals
  if (!filter.mouza && !filter.khatian && !filter.dag) {
    transactions.forEach(tx => {
      tx.khatians.forEach(kh => {
        kh.dags.forEach(d => {
          const amt = Number(d.amount) || 0;
          if (tx.type === 'purchase') totalPurchased += amt;
          else if (tx.type === 'sale') totalSold += amt;
        });
      });
    });
    return {
      totalPurchased,
      totalSold,
      remaining: totalPurchased - totalSold
    };
  }

  // Calculate only for matching dags
  transactions.forEach(tx => {
    tx.khatians.forEach(kh => {
      const actualMouza = kh.mouza?.trim() || tx.mouza;
      kh.dags.forEach(d => {
        if (isDagMatchingFilter(actualMouza, kh, d, filter)) {
          const amt = Number(d.amount) || 0;
          if (tx.type === 'purchase') {
            totalPurchased += amt;
          } else if (tx.type === 'sale') {
            totalSold += amt;
          }
        }
      });
    });
  });

  return {
    totalPurchased,
    totalSold,
    remaining: totalPurchased - totalSold
  };
};

/**
 * Helpers to get unique filter options from the current database based on active filter state
 */
export const getAvailableFilterOptions = (
  transactions: LandTransaction[],
  filter: GlobalFilterState
) => {
  const mouzas = new Set<string>();
  const khatians = new Set<string>();
  const dags = new Set<string>();

  transactions.forEach(tx => {
    tx.khatians.forEach(kh => {
      const actualMouza = kh.mouza?.trim() || tx.mouza;
      
      // All mouzas are available
      if (actualMouza) mouzas.add(actualMouza);

      // Khatians are available only if no mouza is selected, OR if the mouza matches
      if (!filter.mouza || filter.mouza === actualMouza) {
        const kLabel = getKhatianLabel(kh);
        if (kLabel) khatians.add(kLabel);

        // Dags are available only if no khatian is selected, OR if the khatian matches
        if (!filter.khatian || filter.khatian === kLabel) {
          kh.dags.forEach(d => {
            const dLabel = getDagLabel(d);
            if (dLabel) dags.add(dLabel);
          });
        }
      }
    });
  });

  return {
    mouzas: Array.from(mouzas).sort(),
    khatians: Array.from(khatians).sort(),
    dags: Array.from(dags).sort(),
  };
};
