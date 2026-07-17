import { Suspense } from 'react';
import GoogleRegisterClient from './google-register-client';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleRegisterClient />
    </Suspense>
  );
}