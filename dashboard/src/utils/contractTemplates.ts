/**
 * Default contract templates based on profession
 * These templates are used when a company first sets up their contract template
 */

export type Profession = 'vidracaria' | 'serralheria' | 'chaveiro' | 'marido-de-aluguel' | 'eletrica-hidraulica';

export function getDefaultContractTemplate(profession?: Profession | string | null): string {
  switch (profession) {
    case 'vidracaria':
      return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE VIDRAÇARIA

Pelo presente instrumento particular de contrato de prestação de serviços, de um lado {COMPANY_NAME}, inscrita no CNPJ sob o nº {COMPANY_CNPJ}, com sede em {COMPANY_ADDRESS}, doravante denominada CONTRATADA, e de outro lado {CLIENT_NAME}, {CLIENT_CPF_CNPJ}, RG {CLIENT_RG}, residente e domiciliado em {CLIENT_ADDRESS}, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de vidraçaria (instalação e/ou manutenção de vidros, esquadrias e acessórios), conforme especificado no orçamento anexo, no valor total de R$ {TOTAL}.

CLÁUSULA 2ª - DO PRAZO
O serviço terá início em {START_DATE} e será concluído até {DELIVERY_DATE}.

CLÁUSULA 3ª - DO PAGAMENTO
O pagamento será efetuado da seguinte forma: {PAYMENT_DETAILS} através de {PAYMENT_METHOD}.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com qualidade, utilizando materiais de primeira linha e mão de obra especializada, dentro do prazo estabelecido.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer acesso adequado ao local e condições necessárias para a execução dos serviços, incluindo energia elétrica e demais recursos necessários.

CLÁUSULA 6ª - DA GARANTIA
Os serviços executados terão garantia de 90 (noventa) dias contra defeitos de execução e fabricação, contados a partir da data de entrega. A garantia não cobre quebras por mau uso, acidentes ou desgaste natural dos materiais.

CLÁUSULA 7ª - DAS DISPOSIÇÕES GERAIS
Em caso de descumprimento de qualquer cláusula deste contrato, a parte inadimplente ficará sujeita às penalidades previstas em lei.

E, por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor e forma, na presença das testemunhas abaixo assinadas.

{CITY}, {DATE}

_________________________________
{COMPANY_NAME}
CNPJ: {COMPANY_CNPJ}

_________________________________
{CLIENT_NAME}
CPF/CNPJ: {CLIENT_CPF_CNPJ}

Testemunhas:
{WITNESS1_NAME} - CPF: {WITNESS1_CPF}
{WITNESS2_NAME} - CPF: {WITNESS2_CPF}`;

    case 'chaveiro':
      return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CHAVEIRO

Pelo presente instrumento particular de contrato de prestação de serviços, de um lado {COMPANY_NAME}, inscrita no CNPJ sob o nº {COMPANY_CNPJ}, com sede em {COMPANY_ADDRESS}, doravante denominada CONTRATADA, e de outro lado {CLIENT_NAME}, {CLIENT_CPF_CNPJ}, RG {CLIENT_RG}, residente e domiciliado em {CLIENT_ADDRESS}, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de chaveiro (instalação, manutenção, abertura de portas e cópia de chaves), conforme especificado no orçamento anexo, no valor total de R$ {TOTAL}.

CLÁUSULA 2ª - DO PRAZO
O serviço terá início em {START_DATE} e será concluído até {DELIVERY_DATE}.

CLÁUSULA 3ª - DO PAGAMENTO
O pagamento será efetuado da seguinte forma: {PAYMENT_DETAILS} através de {PAYMENT_METHOD}.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com qualidade, utilizando equipamentos e técnicas adequadas, dentro do prazo estabelecido. A CONTRATADA se responsabiliza por eventuais danos causados durante a execução dos serviços.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer acesso adequado ao local e autorização expressa para a execução dos serviços, bem como informações necessárias sobre o tipo de fechadura ou sistema de segurança.

CLÁUSULA 6ª - DA GARANTIA
Os serviços de instalação e manutenção terão garantia de 90 (noventa) dias contra defeitos de execução, contados a partir da data de entrega. A garantia não cobre desgaste natural, mau uso ou intervenções não autorizadas de terceiros.

CLÁUSULA 7ª - DAS DISPOSIÇÕES GERAIS
O CONTRATANTE autoriza expressamente a CONTRATADA a realizar abertura de portas e demais serviços de emergência quando solicitado. Em caso de descumprimento de qualquer cláusula deste contrato, a parte inadimplente ficará sujeita às penalidades previstas em lei.

E, por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor e forma, na presença das testemunhas abaixo assinadas.

{CITY}, {DATE}

_________________________________
{COMPANY_NAME}
CNPJ: {COMPANY_CNPJ}

_________________________________
{CLIENT_NAME}
CPF/CNPJ: {CLIENT_CPF_CNPJ}

Testemunhas:
{WITNESS1_NAME} - CPF: {WITNESS1_CPF}
{WITNESS2_NAME} - CPF: {WITNESS2_CPF}`;

    case 'serralheria':
    case 'marido-de-aluguel':
    case 'eletrica-hidraulica':
    default:
      return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular de contrato de prestação de serviços, de um lado {COMPANY_NAME}, inscrita no CNPJ sob o nº {COMPANY_CNPJ}, com sede em {COMPANY_ADDRESS}, doravante denominada CONTRATADA, e de outro lado {CLIENT_NAME}, {CLIENT_CPF_CNPJ}, RG {CLIENT_RG}, residente e domiciliado em {CLIENT_ADDRESS}, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços conforme especificado no orçamento anexo, no valor total de R$ {TOTAL}.

CLÁUSULA 2ª - DO PRAZO
O serviço terá início em {START_DATE} e será concluído até {DELIVERY_DATE}.

CLÁUSULA 3ª - DO PAGAMENTO
O pagamento será efetuado da seguinte forma: {PAYMENT_DETAILS} através de {PAYMENT_METHOD}.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com qualidade e dentro do prazo estabelecido, utilizando materiais adequados e mão de obra qualificada.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer acesso ao local e condições adequadas para a execução dos serviços, incluindo energia elétrica, água e demais recursos necessários.

CLÁUSULA 6ª - DA GARANTIA
Os serviços executados terão garantia de 90 (noventa) dias contra defeitos de execução, contados a partir da data de entrega. A garantia não cobre desgaste natural, mau uso ou danos causados por terceiros.

CLÁUSULA 7ª - DAS DISPOSIÇÕES GERAIS
Em caso de descumprimento de qualquer cláusula deste contrato, a parte inadimplente ficará sujeita às penalidades previstas em lei.

E, por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor e forma, na presença das testemunhas abaixo assinadas.

{CITY}, {DATE}

_________________________________
{COMPANY_NAME}
CNPJ: {COMPANY_CNPJ}

_________________________________
{CLIENT_NAME}
CPF/CNPJ: {CLIENT_CPF_CNPJ}

Testemunhas:
{WITNESS1_NAME} - CPF: {WITNESS1_CPF}
{WITNESS2_NAME} - CPF: {WITNESS2_CPF}`;
  }
}
