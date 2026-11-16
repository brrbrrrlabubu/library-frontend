import { BookOpen, ChevronRight, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Book, Category } from '../types';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function BookCard({ book, category }: { book: Book; category?: Category }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-cover">
        <img src={book.cover} alt={`Обложка книги «${book.title}»`} loading="lazy" />
        {book.availableCopies === 0 && <span className="cover-label">Нет в наличии</span>}
      </div>
      <div className="book-card-content">
        <span className="book-category">{category?.name || 'Книга'}</span>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
        <div className="book-card-bottom">
          <span className={book.availableCopies > 0 ? 'availability' : 'availability unavailable'}>
            <i />
            {book.availableCopies > 0
              ? `${book.availableCopies} из ${book.totalCopies} доступно`
              : 'Все экземпляры выданы'}
          </span>
          <ChevronRight size={17} />
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <BookOpen size={24} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск по названию или автору',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
