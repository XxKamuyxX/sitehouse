'use client';

export default function HeaderCTA() {
  const handleClick = () => {
    window.open('https://wa.me/5531982798513?text=Olá! Gostaria de solicitar um orçamento para manutenção de cortina de vidro.', '_blank');
  };

  return (
    <button 
      onClick={handleClick}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl"
    >
      Agendar
    </button>
  );
}
