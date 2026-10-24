import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | MentorConnect` : 'MentorConnect - Student Mentorship Portal';
  }, [title]);
}
