/** Public library details are deployment configuration, not hard-coded demo data. */
export const libraryInfo = {
  address: import.meta.env.VITE_LIBRARY_ADDRESS?.trim() || 'Адрес библиотеки не настроен',
  hours: import.meta.env.VITE_LIBRARY_HOURS?.trim() || 'Расписание библиотеки не настроено',
  contact: import.meta.env.VITE_LIBRARY_CONTACT?.trim() || 'Контакты библиотеки не настроены',
};
