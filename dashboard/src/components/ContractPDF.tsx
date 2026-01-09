import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface QuoteItem {
  serviceName: string;
  quantity: number;
  total: number;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  cnpj?: string;
}

interface ContractData {
  clientName: string;
  clientCpfCnpj: string;
  clientAddress: string;
  startDate: string;
  deliveryDate: string;
  paymentMethod: 'pix' | 'card' | 'cash' | 'bank_transfer';
  paymentDetails: string;
  witness1Name?: string;
  witness1Cpf?: string;
  witness2Name?: string;
  witness2Cpf?: string;
  contractText?: string;
}

interface ContractPDFProps {
  quoteItems: QuoteItem[];
  total: number;
  contractData: ContractData;
  companyData?: CompanyData;
  companySignatureUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #0F172A',
    paddingBottom: 15,
  },
  logoContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
    textAlign: 'center',
  },
  companyInfo: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    color: '#1E293B',
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  clauseNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  identification: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  identificationText: {
    fontSize: 10,
    color: '#1E293B',
    lineHeight: 1.6,
    marginBottom: 5,
  },
  servicesList: {
    marginTop: 8,
    marginLeft: 20,
  },
  serviceItem: {
    fontSize: 10,
    color: '#1E293B',
    marginBottom: 5,
    lineHeight: 1.5,
  },
  signatures: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #CBD5E1',
    paddingTop: 10,
    alignItems: 'center',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 5,
  },
  signatureCpf: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 3,
  },
  witnessSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  witnessBox: {
    width: '45%',
    borderTop: '1 solid #CBD5E1',
    paddingTop: 10,
    alignItems: 'center',
  },
});

const paymentMethodLabels = {
  pix: 'PIX',
  card: 'Cartão de Crédito/Débito',
  cash: 'Dinheiro',
  bank_transfer: 'Transferência Bancária',
};

export function ContractPDF({
  quoteItems,
  total,
  contractData,
  companyData,
  companySignatureUrl,
}: ContractPDFProps) {
  const company = companyData || {
    name: 'House Manutenção',
    address: 'Rua Rio Grande do Norte, 726, Savassi',
    phone: '(31) 98279-8513',
    email: 'contato@housemanutencao.com.br',
    cnpj: '42.721.809/0001-52',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                style={{ width: 80, height: 80, marginBottom: 10 }}
              />
            ) : null}
            {!company.logoUrl && (
              <Text style={styles.companyName}>{company.name}</Text>
            )}
          </View>
          <Text style={styles.companyInfo}>
            {company.address}{'\n'}
            Telefone: {company.phone}
            {company.email && ` | Email: ${company.email}`}
            {company.cnpj && ` | CNPJ: ${company.cnpj}`}
          </Text>
        </View>

        {/* Contract Text - Use custom template if provided, otherwise use default */}
        {contractData.contractText ? (() => {
          // Replace variables in contract text
          const today = new Date();
          const formattedDate = today.toLocaleDateString('pt-BR');
          const city = company.address?.split(',')?.[company.address.split(',').length - 2]?.trim() || 'Belo Horizonte';
          
          const replacedText = contractData.contractText
            .replace(/{CLIENT_NAME}/g, contractData.clientName)
            .replace(/{CLIENT_CPF_CNPJ}/g, contractData.clientCpfCnpj || '_________________')
            .replace(/{CLIENT_ADDRESS}/g, contractData.clientAddress)
            .replace(/{START_DATE}/g, contractData.startDate ? formatDate(contractData.startDate) : '_________________')
            .replace(/{DELIVERY_DATE}/g, contractData.deliveryDate ? formatDate(contractData.deliveryDate) : '_________________')
            .replace(/{PAYMENT_METHOD}/g, paymentMethodLabels[contractData.paymentMethod] || contractData.paymentMethod)
            .replace(/{PAYMENT_DETAILS}/g, contractData.paymentDetails || '_________________')
            .replace(/{TOTAL}/g, formatCurrency(total))
            .replace(/{COMPANY_NAME}/g, company.name)
            .replace(/{COMPANY_CNPJ}/g, company.cnpj || '_________________')
            .replace(/{COMPANY_ADDRESS}/g, company.address)
            .replace(/{WITNESS1_NAME}/g, contractData.witness1Name || '_________________')
            .replace(/{WITNESS1_CPF}/g, contractData.witness1Cpf || '_________________')
            .replace(/{WITNESS2_NAME}/g, contractData.witness2Name || '_________________')
            .replace(/{WITNESS2_CPF}/g, contractData.witness2Cpf || '_________________')
            .replace(/{DATE}/g, formattedDate)
            .replace(/{CITY}/g, city);
          
          // Split by newlines and render each line
          const lines = replacedText.split('\n');
          return (
            <View style={styles.section}>
              {lines.map((line, index) => (
                <Text key={index} style={styles.paragraph}>
                  {line || ' '}
                </Text>
              ))}
            </View>
          );
        })() : (
          <>
            {/* Title */}
            <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE VIDRAÇARIA</Text>

            {/* Identification */}
            <View style={styles.identification}>
              <Text style={styles.identificationText}>
                DE UM LADO, <Text style={{ fontWeight: 'bold' }}>{company.name}</Text>, 
                {company.cnpj && ` CNPJ ${company.cnpj},`} estabelecida em {company.address}, 
                doravante denominada CONTRATADA;
              </Text>
              <Text style={styles.identificationText}>
                E DE OUTRO LADO, <Text style={{ fontWeight: 'bold' }}>{contractData.clientName}</Text>, 
                {contractData.clientCpfCnpj.length <= 14 ? ' CPF' : ' CNPJ'} {contractData.clientCpfCnpj}, 
                residente e domiciliado em {contractData.clientAddress}, 
                doravante denominado CONTRATANTE;
              </Text>
              <Text style={styles.identificationText}>
                Têm entre si justo e contratado o seguinte:
              </Text>
            </View>

            {/* Cláusula 1 - Objeto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.clauseNumber}>CLÁUSULA 1ª - DO OBJETO</Text>
              </Text>
              <Text style={styles.paragraph}>
                O presente contrato tem por objeto a prestação de serviços de vidraçaria, 
                conforme especificações abaixo:
              </Text>
              <View style={styles.servicesList}>
                {quoteItems.map((item, index) => (
                  <Text key={index} style={styles.serviceItem}>
                    • {item.serviceName}
                    {item.quantity > 1 && ` (Quantidade: ${item.quantity})`}
                    {item.dimensions?.width && item.dimensions?.height && 
                      ` - Dimensões: ${item.dimensions.width}m x ${item.dimensions.height}m`}
                    {` - Valor: ${formatCurrency(item.total)}`}
                  </Text>
                ))}
              </View>
            </View>

            {/* Cláusula 2 - Valor */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.clauseNumber}>CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO</Text>
              </Text>
              <Text style={styles.paragraph}>
                O valor total dos serviços é de <Text style={{ fontWeight: 'bold' }}>
                  {formatCurrency(total)}
                </Text>, a ser pago via <Text style={{ fontWeight: 'bold' }}>
                  {paymentMethodLabels[contractData.paymentMethod]}
                </Text>, conforme condições: {contractData.paymentDetails}.
              </Text>
            </View>

            {/* Cláusula 3 - Prazos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.clauseNumber}>CLÁUSULA 3ª - DOS PRAZOS</Text>
              </Text>
              <Text style={styles.paragraph}>
                O serviço terá início em <Text style={{ fontWeight: 'bold' }}>
                  {formatDate(contractData.startDate)}
                </Text> e será entregue até o dia <Text style={{ fontWeight: 'bold' }}>
                  {formatDate(contractData.deliveryDate)}
                </Text>.
              </Text>
            </View>

            {/* Cláusula 4 - Garantia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.clauseNumber}>CLÁUSULA 4ª - DA GARANTIA</Text>
              </Text>
              <Text style={styles.paragraph}>
                A CONTRATADA oferece garantia de 90 (noventa) dias para instalação e defeitos 
            de fabricação, contados a partir da data de entrega dos serviços. A garantia 
            não cobre quebras por mau uso, acidentes ou desgaste natural dos materiais.
          </Text>
        </View>

            {/* Cláusula 5 - Disposições Gerais */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.clauseNumber}>CLÁUSULA 5ª - DAS DISPOSIÇÕES GERAIS</Text>
              </Text>
              <Text style={styles.paragraph}>
                O CONTRATANTE se compromete a fornecer acesso adequado ao local da execução 
                dos serviços, bem como disponibilizar energia elétrica e demais condições 
                necessárias para a realização dos trabalhos.
              </Text>
              <Text style={styles.paragraph}>
                A CONTRATADA se compromete a executar os serviços com qualidade e dentro 
                dos prazos estabelecidos, utilizando materiais de primeira linha e mão de 
                obra especializada.
              </Text>
              <Text style={styles.paragraph}>
                Em caso de descumprimento de qualquer cláusula deste contrato, a parte 
                inadimplente ficará sujeita às penalidades previstas em lei.
              </Text>
            </View>

            {/* Signatures */}
            <View style={styles.signatures}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureName}>{company.name}</Text>
                <Text style={styles.signatureCpf}>
                  {company.cnpj && `CNPJ: ${company.cnpj}`}
                </Text>
                {companySignatureUrl ? (
                  <Image
                    src={companySignatureUrl}
                    style={{ width: 150, height: 60, marginTop: 10, objectFit: 'contain' }}
                  />
                ) : (
                  <Text style={{ fontSize: 9, color: '#64748B', marginTop: 20 }}>
                    ___________________________
                  </Text>
                )}
                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 5 }}>
                  CONTRATADA
                </Text>
              </View>
              
              <View style={styles.signatureBox}>
                <Text style={styles.signatureName}>{contractData.clientName}</Text>
                <Text style={styles.signatureCpf}>
                  {contractData.clientCpfCnpj.length <= 14 ? 'CPF' : 'CNPJ'}: {contractData.clientCpfCnpj}
                </Text>
                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 20 }}>
                  ___________________________
                </Text>
                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 5 }}>
                  CONTRATANTE
                </Text>
              </View>
            </View>

            {/* Witnesses */}
            {(contractData.witness1Name || contractData.witness2Name) && (
              <View style={styles.witnessSection}>
                {contractData.witness1Name && (
                  <View style={styles.witnessBox}>
                    <Text style={styles.signatureName}>{contractData.witness1Name}</Text>
                    {contractData.witness1Cpf && (
                      <Text style={styles.signatureCpf}>CPF: {contractData.witness1Cpf}</Text>
                    )}
                    <Text style={{ fontSize: 9, color: '#64748B', marginTop: 20 }}>
                      ___________________________
                    </Text>
                    <Text style={{ fontSize: 9, color: '#64748B', marginTop: 5 }}>
                      TESTEMUNHA 1
                    </Text>
                  </View>
                )}
                
                {contractData.witness2Name && (
                  <View style={styles.witnessBox}>
                    <Text style={styles.signatureName}>{contractData.witness2Name}</Text>
                    {contractData.witness2Cpf && (
                      <Text style={styles.signatureCpf}>CPF: {contractData.witness2Cpf}</Text>
                    )}
                    <Text style={{ fontSize: 9, color: '#64748B', marginTop: 20 }}>
                      ___________________________
                    </Text>
                    <Text style={{ fontSize: 9, color: '#64748B', marginTop: 5 }}>
                      TESTEMUNHA 2
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={{ marginTop: 30, paddingTop: 10, borderTop: '1 solid #CBD5E1' }}>
          <Text style={{ fontSize: 8, color: '#94A3B8', textAlign: 'center' }}>
            Contrato gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
