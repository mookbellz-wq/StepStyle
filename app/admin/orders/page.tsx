// app/admin/orders/page.tsx
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type Search = {
  status?: string; // "รอชำระเงิน" | "ชำระแล้ว" | "จัดส่งแล้ว" | ...
  q?: string;      // ค้นหา id / customer / email
};

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email || null)) {
    // ไม่ใช่แอดมิน → ให้ล็อกอินก่อน (หรือเปลี่ยนปลายทางตามต้องการ)
    redirect(`/login?callbackUrl=/admin/orders`);
  }

  const { status, q } = searchParams;

  const where: any = {};
  if (status) where.status = status;

  if (q && q.trim()) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { customer: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });

  const statuses = ["รอชำระเงิน", "ชำระแล้ว", "จัดส่งแล้ว"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin · คำสั่งซื้อทั้งหมด</h1>

      {/* ควบคุมค้นหา/กรอง */}
      <form className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="ค้นหา: รหัสคำสั่งซื้อ / ชื่อลูกค้า / อีเมล"
          className="border rounded-lg px-3 py-2 min-w-[260px]"
        />
        <select
          name="status"
          defaultValue={status || ""}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">สถานะทั้งหมด</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn">ค้นหา</button>
      </form>

      {/* ตารางคำสั่งซื้อ */}
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="px-3 py-2">รหัส</th>
              <th className="px-3 py-2">ลูกค้า</th>
              <th className="px-3 py-2">ผู้ใช้</th>
              <th className="px-3 py-2">วันที่</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">รายการ</th>
              <th className="px-3 py-2 text-right">ยอดรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const sum = o.items.reduce((acc, it) => acc + it.product.price * it.qty, 0);
              return (
                <tr key={o.id} className="bg-white shadow-sm">
                  <td className="px-3 py-2 font-mono">{o.id}</td>
                  <td className="px-3 py-2">{o.customer}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {o.user?.email || "-"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className="badge">{o.status}</span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      {o.items.map((it) => (
                        <li key={it.id}>
                          {it.product.name} × {it.qty} (
                          {(it.product.price * it.qty).toLocaleString()}
                          )
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {sum.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                  ไม่พบคำสั่งซื้อที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* <p className="text-xs text-gray-500">
        * หน้านี้เป็นแบบอ่านอย่างเดียว (read-only). ถ้าต้องการอัปเดตสถานะคำสั่งซื้อ เดี๋ยวผมเพิ่มปุ่มเปลี่ยนสถานะ + API ให้ได้ครับ
      </p> */}
    </div>
  );
}
