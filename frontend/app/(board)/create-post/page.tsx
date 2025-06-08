"use client"

import { CreatePostModal } from '@/components/features/posts/CreatePostModal'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePostPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isOpen === false) {
      router.push("/home");
    }
  }, [isOpen]);

  return (
    <CreatePostModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  )
}
