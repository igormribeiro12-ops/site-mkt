import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CalendarEntry, ChannelId } from '../../types';
import { CHANNELS, POST_FORMATS } from '../../lib/constants';
import { type Errors, hasErrors, validateCalendarEntry } from '../../lib/validation';
import { Button } from '../ui/Button';
import { SelectField, TextAreaField, TextField } from '../ui/Field';
import { Modal } from '../ui/Modal';

type EntryInput = Omit<CalendarEntry, 'id'>;

interface Props {
  open: boolean;
  entry: CalendarEntry | null;
  defaultDate: string;
  channels: ChannelId[];
  onClose: () => void;
  onSave: (data: EntryInput) => void;
  onDelete: (id: string) => void;
}

export function CalendarEntryModal({ open, entry, defaultDate, channels, onClose, onSave, onDelete }: Props) {
  const available = channels.length ? CHANNELS.filter((c) => channels.includes(c.id)) : CHANNELS;
  const [form, setForm] = useState<EntryInput>({ date: defaultDate, channel: available[0].id, format: '', title: '', notes: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      entry
        ? { date: entry.date, channel: entry.channel, format: entry.format, title: entry.title, notes: entry.notes }
        : { date: defaultDate, channel: available[0].id, format: '', title: '', notes: '' },
    );
    setErrors({});
    setSubmitted(false);
    // O canal padrão só importa no momento em que o modal abre.
  }, [open, entry, defaultDate]);

  const set = <K extends keyof EntryInput>(key: K, value: EntryInput[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validateCalendarEntry(next));
  };

  const save = () => {
    const found = validateCalendarEntry(form);
    setSubmitted(true);
    setErrors(found);
    if (hasErrors(found)) return;
    onSave({ ...form, title: form.title.trim(), notes: form.notes.trim() });
  };

  // Garante que o canal da publicação apareça na lista, mesmo que tenha sido desmarcado depois.
  const channelOptions = available.some((c) => c.id === form.channel)
    ? available
    : [...available, ...CHANNELS.filter((c) => c.id === form.channel)];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? 'Editar publicação planejada' : 'Planejar publicação'}
      description="Organize o que será publicado, onde e quando."
      footer={
        <>
          {entry && (
            <Button
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:mr-auto"
              icon={<Trash2 className="size-4" aria-hidden />}
              onClick={() => onDelete(entry.id)}
            >
              Excluir
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>{entry ? 'Salvar alterações' : 'Adicionar ao calendário'}</Button>
        </>
      }
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField
          id="cal-title"
          label="Tema da publicação"
          required
          data-autofocus
          value={form.title}
          maxLength={80}
          placeholder="Ex.: Bastidores da produção"
          error={errors.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            id="cal-date"
            type="date"
            label="Data"
            required
            value={form.date}
            error={errors.date}
            onChange={(e) => set('date', e.target.value)}
          />
          <SelectField
            id="cal-channel"
            label="Canal"
            required
            value={form.channel}
            options={channelOptions.map((c) => ({ value: c.id, label: c.label }))}
            onChange={(e) => set('channel', e.target.value as ChannelId)}
          />
          <SelectField
            id="cal-format"
            label="Formato"
            required
            value={form.format}
            placeholder="Escolha…"
            options={POST_FORMATS.map((f) => ({ value: f, label: f }))}
            error={errors.format}
            onChange={(e) => set('format', e.target.value)}
          />
        </div>
        <TextAreaField
          id="cal-notes"
          label="Anotações"
          rows={2}
          maxLength={200}
          value={form.notes}
          placeholder="Opcional: ideias, legenda, horário…"
          onChange={(e) => set('notes', e.target.value)}
        />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
