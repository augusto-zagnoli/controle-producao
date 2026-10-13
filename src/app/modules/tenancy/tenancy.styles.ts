// Estilos compartilhados pelas telas do módulo (mesmo padrão visual das telas administrativas).
export const ESTILOS_TENANCY = `
  .pagina { padding: 24px; max-width: 1100px; }
  .cabecalho { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0; color: #1f2937; }
  .ajuda { color: #6b7280; margin: 4px 0 0; font-size: 14px; }
  .card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  th { color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; }
  .acoes { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
  .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font-size: 13px; }
  .btn-primario { background: #2563eb; border-color: #2563eb; color: #fff; }
  .btn-perigo { color: #b91c1c; border-color: #fecaca; }
  .btn[disabled] { opacity: .6; cursor: default; }
  .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end; }
  .campo { display: grid; gap: 4px; }
  .campo label { font-size: 12px; font-weight: 600; color: #374151; }
  .campo input, .campo select { padding: 9px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .campo .invalido { border-color: #dc2626; }
  .check { display: flex; gap: 6px; align-items: center; font-size: 14px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; background: #ecfdf5; color: #047857; }
  .tag.inativa { background: #f3f4f6; color: #6b7280; }
  .erro { color: #b91c1c; background: #fef2f2; padding: 10px; border-radius: 6px; }
  .vazio { color: #6b7280; padding: 12px 0; }
  .sub-tabela { margin: 8px 0 0 16px; }
  @media (max-width: 640px) { .pagina { padding: 12px; } th:nth-child(n+3), td:nth-child(n+3) { display: none; } td.acoes-cel, th.acoes-cel { display: table-cell; } }
`;
