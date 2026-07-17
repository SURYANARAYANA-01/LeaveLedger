import { Suspense } from 'react';
import LoginClient from './login-client';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}