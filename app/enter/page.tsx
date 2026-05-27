'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GROUP_ROUNDS, KNOCKOUT_ROUNDS } from '@/lib/rounds'
import { LoadingState } from '@/components/ui'
import { PickWizard } from '@/components/PickWizard'

function EnterContent() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || ''
  const phase = searchParams.get('phase') === 'knockout' ? 'knockout' : 'group'
  const isEdit = searchParams.get('edit') === 'true'

  const rounds = phase === 'knockout' ? KNOCKOUT_ROUNDS : GROUP_ROUNDS

  return (
    <PickWizard
      name={name}
      isEdit={isEdit}
      phase={phase}
      rounds={rounds}
      apiMethod={isEdit || phase === 'knockout' ? 'PUT' : 'POST'}
      submitLabel={phase === 'knockout' ? 'Save Knockout Picks' : isEdit ? 'Update Picks' : 'Submit Picks'}
      backHref="/"
    />
  )
}

export default function EnterPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EnterContent />
    </Suspense>
  )
}
