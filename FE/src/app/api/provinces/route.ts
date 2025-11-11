import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data provinsi' }, { status: 500 });
  }
}
