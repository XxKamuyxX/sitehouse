/**
 * Profession-based survey field configurations
 */

export type Profession = 'vidracaria' | 'serralheria' | 'chaveiro' | 'marido-de-aluguel' | 'eletrica-hidraulica' | 'climatizacao';

export interface SurveyField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export const PROFESSION_SURVEY_FIELDS: Record<Profession, SurveyField[]> = {
  vidracaria: [
    {
      id: 'quantidade_folhas',
      label: 'Quantidade de Folhas (Lâminas)',
      type: 'number',
      placeholder: 'Ex: 2, 3, 4...',
      required: true,
    },
    {
      id: 'vidro',
      label: 'Tipo de Vidro',
      type: 'select',
      options: [
        { value: 'temperado', label: 'Temperado' },
        { value: 'laminado', label: 'Laminado' },
        { value: 'comum', label: 'Comum' },
        { value: 'outro', label: 'Outro' },
      ],
    },
    {
      id: 'espessura_vidro',
      label: 'Espessura do Vidro (mm)',
      type: 'select',
      options: [
        { value: '6mm', label: '6mm' },
        { value: '8mm', label: '8mm' },
        { value: '10mm', label: '10mm' },
        { value: '12mm', label: '12mm' },
        { value: 'outro', label: 'Outro' },
      ],
    },
    {
      id: 'cor_perfil',
      label: 'Cor do Perfil',
      type: 'select',
      options: [
        { value: 'branco', label: 'Branco' },
        { value: 'preto', label: 'Preto' },
        { value: 'chrome', label: 'Chrome' },
        { value: 'bronze', label: 'Bronze' },
        { value: 'outro', label: 'Outro' },
      ],
    },
    {
      id: 'tipo_trilho',
      label: 'Tipo de Trilho',
      type: 'select',
      options: [
        { value: 'superior', label: 'Superior' },
        { value: 'inferior', label: 'Inferior' },
        { value: 'ambos', label: 'Ambos' },
      ],
    },
    {
      id: 'estado_roldanas',
      label: 'Estado das Roldanas',
      type: 'select',
      options: [
        { value: 'bom', label: 'Bom' },
        { value: 'gastas', label: 'Gastas' },
        { value: 'quebradas', label: 'Quebradas' },
      ],
    },
  ],
  chaveiro: [
    {
      id: 'tipo_porta',
      label: 'Tipo de Porta',
      type: 'select',
      options: [
        { value: 'madeira', label: 'Madeira' },
        { value: 'ferro', label: 'Ferro' },
        { value: 'aluminio', label: 'Alumínio' },
        { value: 'mdf', label: 'MDF' },
        { value: 'outro', label: 'Outro' },
      ],
      required: true,
    },
    {
      id: 'marca_fechadura',
      label: 'Marca da Fechadura',
      type: 'text',
      placeholder: 'Ex: Pado, Falle, etc.',
    },
    {
      id: 'tem_tetra',
      label: 'Tem Tetra?',
      type: 'select',
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ],
    },
    {
      id: 'espessura_porta',
      label: 'Espessura da Porta (mm)',
      type: 'number',
      placeholder: 'Ex: 35, 40, 45...',
    },
    {
      id: 'tipo_fechadura',
      label: 'Tipo de Fechadura',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'digital', label: 'Digital' },
        { value: 'biometrica', label: 'Biométrica' },
        { value: 'tetra', label: 'Tetra' },
      ],
    },
  ],
  climatizacao: [
    {
      id: 'btus',
      label: 'Capacidade (BTUs)',
      type: 'select',
      options: [
        { value: '7000', label: '7.000 BTUs' },
        { value: '9000', label: '9.000 BTUs' },
        { value: '12000', label: '12.000 BTUs' },
        { value: '18000', label: '18.000 BTUs' },
        { value: '24000', label: '24.000 BTUs' },
        { value: 'outro', label: 'Outro' },
      ],
      required: true,
    },
    {
      id: 'marca',
      label: 'Marca',
      type: 'text',
      placeholder: 'Ex: LG, Samsung, Consul, etc.',
    },
    {
      id: 'tensao',
      label: 'Tensão',
      type: 'select',
      options: [
        { value: '110v', label: '110V' },
        { value: '220v', label: '220V' },
        { value: 'bi-volt', label: 'Bi-volt (110V/220V)' },
      ],
      required: true,
    },
    {
      id: 'local_compressor',
      label: 'Local do Compressor',
      type: 'text',
      placeholder: 'Ex: Térreo, 1º andar, telhado...',
    },
    {
      id: 'tipo_instalacao',
      label: 'Tipo de Instalação',
      type: 'select',
      options: [
        { value: 'janela', label: 'Janela' },
        { value: 'split', label: 'Split' },
        { value: 'portatil', label: 'Portátil' },
      ],
    },
  ],
  serralheria: [
    {
      id: 'tipo_estrutura',
      label: 'Tipo de Estrutura',
      type: 'select',
      options: [
        { value: 'portao', label: 'Portão' },
        { value: 'grade', label: 'Grade' },
        { value: 'porta_metalica', label: 'Porta Metálica' },
        { value: 'outro', label: 'Outro' },
      ],
      required: true,
    },
    {
      id: 'material',
      label: 'Material',
      type: 'select',
      options: [
        { value: 'ferro', label: 'Ferro' },
        { value: 'aluminio', label: 'Alumínio' },
        { value: 'aco', label: 'Aço' },
      ],
    },
    {
      id: 'dimensoes',
      label: 'Dimensões (largura x altura em metros)',
      type: 'text',
      placeholder: 'Ex: 2.5 x 2.0',
    },
  ],
  'marido-de-aluguel': [
    {
      id: 'tipo_servico',
      label: 'Tipo de Serviço',
      type: 'select',
      options: [
        { value: 'instalacao', label: 'Instalação' },
        { value: 'reparo', label: 'Reparo' },
        { value: 'montagem', label: 'Montagem' },
        { value: 'manutencao', label: 'Manutenção' },
      ],
      required: true,
    },
    {
      id: 'descricao_problema',
      label: 'Descrição do Problema',
      type: 'textarea',
      placeholder: 'Descreva detalhadamente o problema ou serviço necessário...',
      required: true,
    },
  ],
  'eletrica-hidraulica': [
    {
      id: 'tipo_servico',
      label: 'Tipo de Serviço',
      type: 'select',
      options: [
        { value: 'eletrico', label: 'Elétrico' },
        { value: 'hidraulico', label: 'Hidráulico' },
        { value: 'ambos', label: 'Ambos' },
      ],
      required: true,
    },
    {
      id: 'descricao_problema',
      label: 'Descrição do Problema',
      type: 'textarea',
      placeholder: 'Descreva detalhadamente o problema...',
      required: true,
    },
    {
      id: 'tensao',
      label: 'Tensão (apenas para serviços elétricos)',
      type: 'select',
      options: [
        { value: '110v', label: '110V' },
        { value: '220v', label: '220V' },
        { value: 'bi-volt', label: 'Bi-volt' },
      ],
    },
  ],
};

/**
 * Get survey fields for a profession
 */
export function getSurveyFields(profession: string | undefined): SurveyField[] {
  if (!profession || !(profession in PROFESSION_SURVEY_FIELDS)) {
    // Default to generic textarea
    return [
      {
        id: 'descricao_problema',
        label: 'Descrição do Problema',
        type: 'textarea',
        placeholder: 'Descreva detalhadamente o problema ou serviço necessário...',
        required: true,
      },
    ];
  }
  return PROFESSION_SURVEY_FIELDS[profession as Profession];
}
