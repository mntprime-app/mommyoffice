'use client';

export type ExportOrder = {
  created_at: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  course_title: string;
  amount: number;
  status: string;
  qpay_invoice_id: string | null;
};

export function OrdersExportButton({ orders }: { orders: ExportOrder[] }) {
  function handleExport() {
    const headers = ['Огноо', 'Нэр', 'И-мэйл', 'Утас', 'Бүтээгдэхүүн', 'Дүн (₮)', 'Статус', 'QPay Invoice'];
    const rows = orders.map((o) => [
      new Date(o.created_at).toLocaleString('mn-MN'),
      o.buyer_name || '',
      o.buyer_email,
      o.buyer_phone || '',
      o.course_title,
      o.amount,
      o.status === 'paid' ? 'Төлөгдсөн' : o.status === 'pending' ? 'Хүлээгдэж байна' : o.status,
      o.qpay_invoice_id || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const bom = '﻿'; // UTF-8 BOM so Excel reads Mongolian correctly
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mommyoffice-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '8px 16px', borderRadius: '8px', border: '1px solid #2a2a2a',
        background: '#1a1a1a', color: '#00B5AD', fontSize: '13px', fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      📥 Excel экспорт
    </button>
  );
}
