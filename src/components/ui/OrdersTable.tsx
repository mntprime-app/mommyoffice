'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder, updateOrderStatus } from '@/app/actions/admin';

export type OrderRow = {
  id: string;
  created_at: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  course_id: string | null;
  course_title: string;
  amount: number;
  status: string;
  qpay_invoice_id: string | null;
};

export function OrdersTable({ orders, locale }: { orders: OrderRow[]; locale: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function handleExport() {
    const headers = ['Огноо', 'Нэр', 'И-мэйл', 'Утас', 'Бүтээгдэхүүн', 'Дүн (₮)', 'Статус', 'QPay Invoice'];
    const rows = orders.map(o => [
      new Date(o.created_at).toLocaleString('mn-MN'),
      o.buyer_name || '',
      o.buyer_email,
      o.buyer_phone || '',
      o.course_title,
      o.amount,
      o.status === 'paid' ? 'Төлөгдсөн' : 'Хүлээгдэж байна',
      o.qpay_invoice_id || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mommyoffice-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  function handleDelete(order: OrderRow) {
    const isPaid = order.status === 'paid';
    const msg = isPaid
      ? `⚠️ Энэ захиалга ТӨЛӨГДСӨН байна.\n\nУстгасан ч оюутны хандах эрх автоматаар хасагдахгүй.\nЭрхийг хасахын тулд "Эрх олгох" хэсгийг ашиглана уу.\n\nЗахиалгыг устгах уу?`
      : `"${order.buyer_email}" захиалгыг устгах уу?`;
    if (!window.confirm(msg)) return;

    setActionId(order.id);
    startTransition(async () => {
      const { error } = await deleteOrder(order.id);
      setActionId(null);
      if (error) { alert('Алдаа: ' + error); return; }
      router.refresh();
    });
  }

  // ── Mark as Paid ────────────────────────────────────────────────────────────
  function handleMarkPaid(order: OrderRow) {
    if (!window.confirm(`"${order.buyer_email}" захиалгыг "Төлөгдсөн" болгох уу?\n\nАнхааруулга: Оюутны хандах эрх автоматаар олгогдохгүй. Эрх олгохыг "Эрх олгох" хэсгээс хийнэ үү.`)) return;
    setActionId(order.id);
    startTransition(async () => {
      const { error } = await updateOrderStatus(order.id, 'paid');
      setActionId(null);
      if (error) { alert('Алдаа: ' + error); return; }
      router.refresh();
    });
  }

  // ── Recheck QPay ─────────────────────────────────────────────────────────────
  // Calls the live QPay API to check if the invoice was actually paid.
  // If confirmed: marks order paid, creates enrollment + access token, sends welcome email.
  async function handleRecheck(order: OrderRow) {
    if (!order.qpay_invoice_id) {
      alert('QPay invoice ID олдсонгүй. Дахин шалгах боломжгүй.');
      return;
    }
    if (!window.confirm(`QPay-д ${order.buyer_email} захиалгын төлбөрийг дахин шалгах уу?\n\nТөлбөр батлагдсан бол:\n✅ Статус "Төлөгдсөн" болно\n✅ Оюутны хандах эрх автоматаар үүснэ\n✅ Тавтай морилно уу и-мэйл илгээгдэнэ`)) return;

    setRecheckingId(order.id);
    try {
      const res = await fetch(`/api/qpay/check?orderId=${encodeURIComponent(order.id)}`);
      const data = await res.json() as { ok: boolean; paid?: boolean; error?: string };
      if (!data.ok) {
        alert('Алдаа: ' + (data.error || 'Server error'));
        return;
      }
      if (data.paid) {
        alert(`✅ Төлбөр батлагдлаа!\n\n${order.buyer_email} и-мэйл рүү хандалтын холбоос илгээгдлээ.`);
        router.refresh();
      } else {
        alert(`⚠️ QPay дахин шалгалаа — төлбөр хийгдээгүй байна.\n\nInvoice: ${order.qpay_invoice_id}\n\nОюутантай холбогдоно уу.`);
      }
    } catch (e) {
      alert('Сүлжээний алдаа. Дахин оролдоно уу.');
    } finally {
      setRecheckingId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Table header row */}
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e5e5' }}>Захиалгууд ({orders.length})</span>
        <button
          onClick={handleExport}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#00B5AD', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          📥 Excel экспорт
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#222', borderBottom: '1px solid #2a2a2a' }}>
              {['Огноо', 'Нэр', 'И-мэйл', 'Утас', 'Бүтээгдэхүүн', 'Дүн', 'Статус', 'QPay Invoice', 'Үйлдэл'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9ca3af', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const paid = order.status === 'paid';
              const date = new Date(order.created_at);
              const isActing = actionId === order.id && pending;
              return (
                <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #2a2a2a' : 'none', opacity: isActing ? 0.5 : 1, transition: 'opacity .2s' }}>
                  <td style={{ padding: '11px 14px', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {date.toLocaleDateString('mn-MN')}<br />
                    <span style={{ fontSize: '11px' }}>{date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#e5e5e5', whiteSpace: 'nowrap' }}>
                    {order.buyer_name || <span style={{ color: '#4b5563' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 500, color: '#e5e5e5' }}>{order.buyer_email}</td>
                  <td style={{ padding: '11px 14px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {order.buyer_phone || <span style={{ color: '#4b5563' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px', maxWidth: '180px' }}>
                    <span style={{ color: '#e5e5e5', fontWeight: 500 }}>{order.course_title}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: paid ? '#10b981' : '#e5e5e5', whiteSpace: 'nowrap' }}>
                    {order.amount > 0 ? `${order.amount.toLocaleString()}₮` : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                      background: paid ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: paid ? '#10b981' : '#f59e0b',
                    }}>
                      {paid ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж байна'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' }}>
                    {order.qpay_invoice_id ? order.qpay_invoice_id.slice(0, 14) + '…' : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {!paid && order.qpay_invoice_id && (
                        <button
                          onClick={() => handleRecheck(order)}
                          disabled={isActing || recheckingId === order.id}
                          title="QPay-д дахин шалгах — төлбөр батлагдсан бол эрх автоматаар үүснэ"
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,181,173,0.5)', background: 'rgba(0,181,173,0.12)', color: '#00B5AD', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {recheckingId === order.id ? '⏳ Шалгаж байна…' : '🔄 QPay шалгах'}
                        </button>
                      )}
                      {!paid && (
                        <button
                          onClick={() => handleMarkPaid(order)}
                          disabled={isActing || recheckingId === order.id}
                          title="Гараар төлөгдсөн гэж тэмдэглэх (эрх олгогдохгүй)"
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✓ Гараар
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(order)}
                        disabled={isActing || recheckingId === order.id}
                        title="Захиалга устгах"
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        🗑 Устгах
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  Захиалга байхгүй байна
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
