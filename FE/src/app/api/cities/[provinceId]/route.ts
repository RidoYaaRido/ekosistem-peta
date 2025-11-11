import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ provinceId: string }> }) {
  try {
    const { provinceId } = await context.params; // <-- Tambahkan await di sini

    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`
    );

    if (!res.ok) {
      throw new Error('Gagal fetch data kota');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saat ambil data kota:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kota' }, { status: 500 });
  }
}