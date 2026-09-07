/**
 * RG-10/RG-11 : formulaire dynamique rendu à partir du schéma de la branche.
 * Le champ affiché conditionnellement est géré selon la règle `show_if`.
 */
export default function DynamicForm({ schema, values, onChange }) {
    const fields = schema?.fields || [];

    const estVisible = (field) => {
        const showIf = field.show_if;
        if (!showIf || !showIf.field) return true;
        return values[showIf.field] === showIf.value;
    };

    const set = (name, value) => onChange({ ...values, [name]: value });

    return (
        <div className="space-y-4">
            {fields.map((field) => {
                if (!estVisible(field)) return null;
                const id = `f-${field.name}`;
                const label = field.label || field.name;
                const required = field.required;

                return (
                    <div key={field.name}>
                        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                            {label}
                            {required && <span className="text-red-500"> *</span>}
                        </label>

                        {field.type === 'textarea' && (
                            <textarea
                                id={id}
                                value={values[field.name] || ''}
                                onChange={(e) => set(field.name, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                rows={3}
                            />
                        )}

                        {field.type === 'select' && (
                            <select
                                id={id}
                                value={values[field.name] || ''}
                                onChange={(e) => set(field.name, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                            >
                                <option value="">— Sélectionner —</option>
                                {(field.options || []).map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label || opt.value}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === 'date' && (
                            <input
                                id={id}
                                type="date"
                                value={values[field.name] || ''}
                                onChange={(e) => set(field.name, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                            />
                        )}

                        {field.type === 'number' && (
                            <input
                                id={id}
                                type="number"
                                value={values[field.name] ?? ''}
                                onChange={(e) => set(field.name, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                            />
                        )}

                        {field.type === 'bool' && (
                            <input
                                id={id}
                                type="checkbox"
                                checked={Boolean(values[field.name])}
                                onChange={(e) => set(field.name, e.target.checked)}
                                className="mt-2"
                            />
                        )}

                        {(!field.type || field.type === 'text') && (
                            <input
                                id={id}
                                type="text"
                                value={values[field.name] || ''}
                                onChange={(e) => set(field.name, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
