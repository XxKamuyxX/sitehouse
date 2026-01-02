import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface QuoteItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  pricingMethod?: 'm2' | 'linear' | 'fixed' | 'unit';
  dimensions?: {
    width: number;
    height: number;
    area?: number;
  };
  glassColor?: string;
  profileColor?: string;
  isInstallation?: boolean;
}

interface PDFConfig {
  companyName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

interface QuotePDFProps {
  clientName: string;
  clientAddress: string;
  clientCondominium: string;
  clientPhone: string;
  clientEmail: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  quoteNumber?: string;
  createdAt?: Date;
  warranty?: string;
  observations?: string;
  pdfConfig?: PDFConfig;
  photos?: string[];
  hasRisk?: boolean;
  cnpj?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #0F172A',
    paddingBottom: 15,
  },
  logoContainer: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  clientInfo: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  clientLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  clientValue: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #E2E8F0',
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellCenter: {
    flex: 1,
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 10,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
    fontSize: 8,
    color: '#64748B',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  footerText: {
    marginBottom: 5,
    lineHeight: 1.5,
  },
  signature: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
  },
  signatureLine: {
    borderTop: '1 solid #0F172A',
    width: 300,
    marginTop: 50,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 9,
    color: '#64748B',
  },
  validity: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    fontSize: 9,
    color: '#92400E',
    textAlign: 'center',
  },
  photoSection: {
    marginTop: 30,
    pageBreak: 'before',
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  photoContainer: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 15,
  },
  photoImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    marginBottom: 5,
  },
  photoCaption: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  riskWarning: {
    backgroundColor: '#FEE2E2',
    border: '2 solid #DC2626',
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  riskWarningText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: 'bold',
    lineHeight: 1.5,
  },
  companySignature: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
    alignItems: 'center',
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 10,
  },
  cnpjText: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 5,
  },
});

export function QuotePDF({
  clientName,
  clientAddress,
  clientCondominium,
  clientPhone,
  clientEmail,
  items,
  subtotal,
  discount,
  total,
  quoteNumber,
  createdAt,
  warranty,
  observations,
  pdfConfig,
  photos = [],
  hasRisk = false,
  cnpj = '42.721.809/0001-52',
}: QuotePDFProps) {
  // photos, hasRisk, and cnpj are used in the JSX below
  const config = pdfConfig || {
    companyName: 'House Manutenção',
    address: 'Rua Rio Grande do Norte, 726, Savassi',
    city: 'Belo Horizonte - MG',
    phone: '(31) 98279-8513',
    email: 'contato@housemanutencao.com.br',
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) {
      const now = new Date();
      return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              src="/logo.png"
              style={{ width: 80, height: 80, marginBottom: 10 }}
            />
            <Text style={styles.companyName}>{config.companyName}</Text>
          </View>
          <Text style={styles.companyInfo}>
            {config.address}{'\n'}
            {config.city}{'\n'}
            Telefone: {config.phone}{'\n'}
            Email: {config.email}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>ORÇAMENTO DE SERVIÇOS</Text>

        {/* Quote Info */}
        {quoteNumber && (
          <View style={styles.section}>
            <Text style={styles.clientLabel}>Número do Orçamento:</Text>
            <Text style={styles.clientValue}>{quoteNumber}</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.clientLabel}>Data de Emissão:</Text>
          <Text style={styles.clientValue}>{formatDate(createdAt)}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientLabel}>CLIENTE:</Text>
          <Text style={styles.clientValue}>{clientName}</Text>
          <Text style={styles.clientLabel}>CONDOMÍNIO:</Text>
          <Text style={styles.clientValue}>{clientCondominium}</Text>
          <Text style={styles.clientLabel}>ENDEREÇO:</Text>
          <Text style={styles.clientValue}>{clientAddress}</Text>
          <Text style={styles.clientLabel}>TELEFONE:</Text>
          <Text style={styles.clientValue}>{clientPhone}</Text>
          <Text style={styles.clientLabel}>EMAIL:</Text>
          <Text style={styles.clientValue}>{clientEmail}</Text>
        </View>

        {/* Services Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 3 }]}>SERVIÇO</Text>
            <Text style={styles.tableCellCenter}>QTD</Text>
            <Text style={styles.tableCellRight}>PREÇO UNIT.</Text>
            <Text style={styles.tableCellRight}>TOTAL</Text>
          </View>
          {items.map((item, index) => {
            // Build service description with pricing details
            let serviceDescription = item.serviceName;
            
            if (item.isInstallation && item.pricingMethod) {
              if (item.pricingMethod === 'm2' && item.dimensions) {
                const area = item.dimensions.area || (item.dimensions.width * item.dimensions.height);
                serviceDescription = `${item.serviceName} (${area.toFixed(2)}m²) - ${formatCurrency(item.unitPrice)}/m²`;
                if (item.quantity > 1) {
                  serviceDescription += ` × ${item.quantity}`;
                }
              } else if (item.pricingMethod === 'linear' && item.dimensions) {
                const linearMeters = item.dimensions.width * item.quantity;
                serviceDescription = `${item.serviceName} (${linearMeters.toFixed(2)}m) - ${formatCurrency(item.unitPrice)}/m linear`;
              } else if (item.pricingMethod === 'fixed') {
                serviceDescription = `${item.serviceName} - ${formatCurrency(item.total)} (Preço Fechado)`;
              }
              
              // Add color info if available
              if (item.glassColor || item.profileColor) {
                const colorInfo = [];
                if (item.glassColor) colorInfo.push(`Vidro: ${item.glassColor}`);
                if (item.profileColor) colorInfo.push(`Perfil: ${item.profileColor}`);
                if (colorInfo.length > 0) {
                  serviceDescription += `\n${colorInfo.join(' | ')}`;
                }
              }
            }

            return (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 3 }]}>
                  <Text>{serviceDescription}</Text>
                </View>
                <Text style={styles.tableCellCenter}>{item.quantity}</Text>
                <Text style={styles.tableCellRight}>
                  {item.pricingMethod === 'fixed' ? '-' : formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.tableCellRight}>{formatCurrency(item.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Desconto:</Text>
              <Text>- {formatCurrency(discount)}</Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text>TOTAL:</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Warranty */}
        {warranty && (
          <View style={styles.validity}>
            <Text style={{ fontWeight: 'bold' }}>GARANTIA: {warranty.toUpperCase()}</Text>
          </View>
        )}

        {/* Validity */}
        <View style={styles.validity}>
          <Text style={{ fontWeight: 'bold' }}>VALIDADE: 10 DIAS</Text>
        </View>

        {/* Observations */}
        {observations && (
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>OBSERVAÇÕES:</Text>
            <Text style={styles.footerText}>{observations}</Text>
          </View>
        )}

        {/* Payment Terms */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>CONDIÇÕES DE PAGAMENTO:</Text>
          <Text style={styles.footerText}>
            • Pix: Desconto de 5% no pagamento à vista{'\n'}
            • Cartão de Crédito: Parcelamento em até 3x sem juros
          </Text>
        </View>

        {/* Legal Text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Serviço realizado conforme normas técnicas. Garantia conforme especificado acima em todos os serviços executados.
          </Text>
        </View>

        {/* Risk Warning */}
        {hasRisk && (
          <View style={styles.riskWarning}>
            <Text style={styles.riskWarningText}>
              ⚠️ ATENÇÃO: Identificamos fadiga no sistema (vidros descolados/ressecados). 
              A empresa não se responsabiliza por quebras decorrentes do manuseio de peças já comprometidas estruturalmente.
            </Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{clientName}</Text>
          <Text style={styles.signatureText}>
            {hasRisk 
              ? 'Declaro ciência do risco preexistente e autorizo o serviço, isentando a contratada de responsabilidade sobre quebras de vidros já danificados.'
              : 'Cliente'}
          </Text>
        </View>

        {/* Company Signature & CNPJ */}
        <View style={styles.companySignature}>
          <Image
            src="/signature.png"
            style={styles.signatureImage}
          />
          <Text style={styles.cnpjText}>
            House Manutenção - CNPJ: {cnpj}
          </Text>
        </View>
      </Page>

      {/* Photo Report Page */}
      {photos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.photoSection}>
            <Text style={styles.photoTitle}>RELATÓRIO DE VISTORIA - FOTOS DO SERVIÇO</Text>
            <View style={styles.photoGrid}>
              {photos.map((photoUrl, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image
                    src={photoUrl}
                    style={styles.photoImage}
                  />
                  <Text style={styles.photoCaption}>Foto {index + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}

