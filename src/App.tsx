import { version } from '../package.json';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, BACKEND_BASE } from './api';
import { draftOf, fields, labels, selectCars, validate, type Car, type CarInput, type Field } from './cars';

function Modal({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; const opener = document.activeElement as HTMLElement | null; dialog.showModal(); return () => { dialog.close(); if (opener?.isConnected) opener.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <h2 id="dialog-title">{title}</h2>{children}
  </dialog>;
}

function CarEditor({ car, busy, error, save, close }: { car?: Car; busy: boolean; error: string; save: (value: CarInput) => void; close: () => void }) {
  const [draft, setDraft] = useState(draftOf(car));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validate(draft); setErrors(result.errors);
    if (Object.keys(result.errors).length) { document.getElementById(`field-${Object.keys(result.errors)[0]}`)?.focus(); return; }
    save(result.value);
  };
  return <Modal title={car ? 'Edit car' : 'Add car'} busy={busy} close={close}>
    <p className="muted">All six fields are required. Prices use the backend's currency.</p>
    <form onSubmit={submit} noValidate aria-busy={busy}>
      <div className="form-grid">{fields.map(key => <div key={key}>
        <label htmlFor={`field-${key}`}>{labels[key]}</label>
        <input id={`field-${key}`} required maxLength={key === 'modelYear' || key === 'price' ? undefined : 100} type={key === 'modelYear' || key === 'price' ? 'number' : 'text'} step={key === 'modelYear' ? '1' : 'any'} value={draft[key]} disabled={busy} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => setDraft({ ...draft, [key]: event.target.value })}/>
        {errors[key] && <p className="field-error" id={`error-${key}`}>{errors[key]}</p>}
      </div>)}</div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="dialog-actions"><button type="button" disabled={busy} onClick={close}>Cancel</button><button className="primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save car'}</button></div>
    </form>
  </Modal>;
}

export default function App() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['cars'], queryFn: () => api.list() });
  const [editor, setEditor] = useState<{ car?: Car } | null>(null);
  const [deleting, setDeleting] = useState<Car | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Field>('brand');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [notice, setNotice] = useState('');
  const refresh = () => client.invalidateQueries({ queryKey: ['cars'] });
  const saving = useMutation({ mutationFn: ({ value, id }: { value: CarInput; id?: string }) => api.save(value, id), onSuccess: async (_, input) => { setEditor(null); setNotice(input.id ? 'Car updated.' : 'Car added.'); await refresh(); } });
  const removing = useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess: async () => { setDeleting(null); setNotice('Car deleted.'); await refresh(); } });
  const busy = saving.isPending || removing.isPending || list.isFetching;
  const cars = selectCars(list.data || [], query, sort, direction);
  const openEditor = (car?: Car) => { saving.reset(); setNotice(''); setEditor({ car }); };
  const openDelete = (car: Car) => { removing.reset(); setNotice(''); setDeleting(car); };
  return <>
    <header><div className="header-inner"><span className="logo" aria-hidden="true">CS</span><div><p className="eyebrow">THE SHOWROOM</p><h1>Car Shop</h1></div><span className="header-tag">Inventory workspace</span></div></header>
    <main>
      <section className="heading"><div><p className="eyebrow">STOCK MANAGEMENT</p><h2>Your next drive starts here.</h2><p className="muted">Browse the collection. Keep every detail up to date.</p></div><button className="primary" disabled={busy || !list.data} onClick={() => openEditor()}>+ Add car</button></section>
      <p className={api.isDemo ? 'environment demo-mode' : 'environment'} role="status">{api.isDemo ? 'LOCAL DEMO — course API unavailable. Changes stay in this tab and are never uploaded. Reload the page to retry the API; demo edits will reset.' : BACKEND_BASE.startsWith('http://127.0.0.1') || BACKEND_BASE.startsWith('http://localhost') ? 'Local practice backend' : `${list.isSuccess ? 'Connected to' : 'Using'} shared course backend — saved changes affect its inventory.`}</p>
      <section className="inventory" aria-label="Car inventory">
        <div className="toolbar"><div className="search"><label htmlFor="search">Search cars</label><input id="search" type="search" placeholder="Brand, model, color, fuel, year or price" value={query} onChange={event => setQuery(event.target.value)}/></div><div><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={event => setSort(event.target.value as Field)}>{fields.map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></div><button aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}>{direction === 'asc' ? '↑ Ascending' : '↓ Descending'}</button><button disabled={list.isFetching || busy} onClick={() => { setNotice(''); void list.refetch(); }}>Refresh</button></div>
        <div className="list-status" aria-live="polite">{list.isFetching ? 'Loading inventory…' : `${cars.length} of ${list.data?.length ?? 0} cars`}{notice && <span className="success">{notice}</span>}</div>
        {list.isError && <div className="error" role="alert"><strong>Inventory could not be refreshed.</strong><p>{list.error.message}</p><button disabled={list.isFetching} onClick={() => void list.refetch()}>Try again</button></div>}
        {list.data && !cars.length && <div className="empty"><h3>{list.data.length ? 'No matching cars' : 'The showroom is empty'}</h3><p>{list.data.length ? 'Try another search or clear the filter.' : 'Add the first car to begin.'}</p>{query && <button onClick={() => setQuery('')}>Clear search</button>}</div>}
        {!!cars.length && <div className="table-wrap"><table><caption className="sr-only">Cars in stock. Use the sort controls above to change order.</caption><thead><tr>{fields.map(key => <th scope="col" key={key} aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{labels[key]}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</th>)}<th scope="col">Actions</th></tr></thead><tbody>{cars.map(car => <tr key={car.id}>{fields.map(key => <td key={key} data-label={labels[key]}>{key === 'price' ? car.price.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : car[key]}</td>)}<td data-label="Actions"><div className="row-actions"><button disabled={busy} aria-label={`Edit ${car.brand} ${car.model}`} onClick={() => openEditor(car)}>Edit</button><button className="danger-text" disabled={busy} aria-label={`Delete ${car.brand} ${car.model}`} onClick={() => openDelete(car)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <footer>Car Shop / React + TypeScript · v{version}<span>Search covers all six car fields.</span></footer>
    </main>
    {editor && <CarEditor car={editor.car} busy={saving.isPending} error={saving.error?.message || ''} close={() => setEditor(null)} save={value => saving.mutate({ value, id: editor.car?.id })}/>}
    {deleting && <Modal title="Delete car?" busy={removing.isPending} close={() => setDeleting(null)}><p>Remove <strong>{deleting.brand} {deleting.model}</strong> ({deleting.modelYear}, {deleting.color}) from inventory?</p><p className="muted">This action cannot be undone.</p>{removing.error && <p className="error" role="alert">{removing.error.message}</p>}<div className="dialog-actions"><button disabled={removing.isPending} onClick={() => setDeleting(null)}>Cancel</button><button className="danger" disabled={removing.isPending} onClick={() => removing.mutate(deleting.id)}>{removing.isPending ? 'Deleting…' : 'Delete car'}</button></div></Modal>}
  </>;
}
