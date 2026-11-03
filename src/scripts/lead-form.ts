import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';
import { initForms } from './forms';

// Calendário pt-BR (data mínima = hoje) com máscara dd/mm/aaaa digitada à mão
function initDatepicker(input: HTMLInputElement) {
  flatpickr(input, { locale: Portuguese, dateFormat: 'd/m/Y', minDate: 'today', allowInput: true, disableMobile: true });
  input.addEventListener('input', () => {
    const d = input.value.replace(/\D/g, '').slice(0, 8);
    input.value = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
}

let iniciado = false;
export function initLeadForms() {
  if (iniciado) return;
  iniciado = true;
  const run = () => {
    document.querySelectorAll<HTMLInputElement>('input[data-datepicker]').forEach(initDatepicker);
    initForms();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
