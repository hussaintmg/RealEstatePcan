import { redirect } from 'next/navigation';

export default function LegacyCmsRedirect() {
  redirect('/dashboard/website/cms');
}
