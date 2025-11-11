// src/features/inventory/pages/InventoryPage.tsx
import { useMemo, useState } from 'react';
import { FiSearch, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { useGetInventoryQuery } from '../api';
import AdjustStockModal from './AdjustStockModal';
import type { InventoryDetailsDto } from '../types';
import '../styles/InventoryPage.css';

export default function InventoryPage() {
  const { data, isFetching, refetch } = useGetInventoryQuery();
  const [q, setQ] = useState('');
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);

  const rows = useMemo(() => {
    const list = (data ?? []).slice().sort((a, b) => a.productId - b.productId);
    if (!q.trim()) return list;
    const term = q.trim().toLowerCase();
    return list.filter(x =>
      String(x.productId).includes(term) ||
      // if you have product name in snapshot later, map it here
      String(x.quantityOnHand).includes(term)
    );
  }, [data, q]);

  return (
    <div className="rms-uber product-list">
      <div className="page-head">
        <h2 className="page-title">Inventory</h2>
        <div style={{display:'inline-flex', gap:8}}>
          <button className="btn-primary-uber" onClick={() => refetch()} disabled={isFetching}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="card filters">
        <div className="card-body">
          <div className="rms-search__bar" style={{maxWidth:520}}>
            <FiSearch />
            <input
              className="rms-search__input"
              placeholder="Search by ProductId / Quantity"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refetch()}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card card--table">
        <div className="card-body">
            <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{width:120}}>Product ID</th>
                <th>On Hand</th>
                <th>Updated</th>
                <th className="text-center" style={{width:160}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rows as InventoryDetailsDto[]).map(r => (
                <tr key={r.productId}>
                  <td className="sticky-col">{r.productId}</td>
                  <td>{r.quantityOnHand}</td>
                  <td>{new Date(r.updatedAt).toLocaleString()}</td>
                  <td className="action-col">
                    <button
                      className="btn-chip btn-chip--secondary"
                      onClick={() => { setEditProductId(r.productId); setShowAdjust(true); }}
                      title="Adjust Stock"
                    >
                      <FiEdit2 /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center" style={{padding:'24px'}}>
                    {isFetching ? 'Loading…' : 'No inventory yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <AdjustStockModal
        productId={editProductId}
        show={showAdjust}
        onClose={() => setShowAdjust(false)}
        onAdjusted={() => refetch()}
      />
    </div>
  );
}
