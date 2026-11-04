import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DIFY_USER = 'aifball-web-user';
const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'خدمة الصور غير مهيأة.' }, { status: 503 });

  try {
    const incoming = await request.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'لم يتم إرفاق صورة.' }, { status: 400 });
    }
    if (!ALLOWED_IMAGES.has(file.type)) {
      return NextResponse.json({ error: 'صيغة الصورة غير مدعومة. اختر JPG أو PNG أو WebP أو GIF.' }, { status: 415 });
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'حجم الصورة غير صالح أو يتجاوز 10 ميجابايت.' }, { status: 413 });
    }

    const form = new FormData();
    form.append('file', file, file.name || 'image');
    // This must match the user value supplied to /v1/chat-messages.
    form.append('user', DIFY_USER);

    const response = await fetch('https://api.dify.ai/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: request.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      // Keep upstream credentials and response bodies out of user-facing errors.
      return NextResponse.json(
        { error: response.status === 413 ? 'الصورة أكبر من الحد المسموح في Dify.' : 'تعذر رفع الصورة إلى خدمة التحليل.', upstream_status: response.status },
        { status: response.status === 413 ? 413 : 502 }
      );
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string' || !data.id) {
      return NextResponse.json({ error: 'لم يتم تأكيد حفظ الصورة لدى خدمة التحليل.' }, { status: 502 });
    }
    return NextResponse.json({ id: data.id });
  } catch (error) {
    if (request.signal.aborted) return NextResponse.json({ error: 'أُلغي رفع الصورة.' }, { status: 408 });
    console.error('Dify image upload failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الصورة.' }, { status: 500 });
  }
}
