import { notFound } from 'next/navigation';
import DeviceChecks from './DeviceChecks';
export const dynamic = 'force-dynamic';
export default function DevicePreview() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
  return <DeviceChecks />;
}
