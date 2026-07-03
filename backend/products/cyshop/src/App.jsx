import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  ReceiptText,
  BarChart3,
  Sun,
  Moon,
  Search,
  Bell,
  Plus,
  Minus,
  Trash2,
  Bot,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Check,
  Package,
  Users,
  Calendar,
  Settings as SettingsIcon,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building,
  Store,
  Bike
} from 'lucide-react';

const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Cyber Espresso', price: 3.5, category: 'Coffee', prepTime: '3 min' },
  { id: 'p2', name: 'Quantum Latte', price: 4.5, category: 'Coffee', prepTime: '4 min' },
  { id: 'p3', name: 'Neo Cappuccino', price: 4.25, category: 'Coffee', prepTime: '4 min' },
  { id: 'p4', name: 'Hyper Mocha', price: 5.0, category: 'Coffee', prepTime: '5 min' },
  { id: 'p5', name: 'CyBurger Premium', price: 10.5, category: 'Mains', prepTime: '10 min' },
  { id: 'p6', name: 'Synth Pizza Margherita', price: 12.0, category: 'Mains', prepTime: '12 min' },
  { id: 'p7', name: 'Grid Shawarma Wrap', price: 7.5, category: 'Mains', prepTime: '8 min' },
  { id: 'p8', name: 'Vector Caesar Salad', price: 8.5, category: 'Mains', prepTime: '6 min' },
  { id: 'p9', name: 'Warp Speed Waffle', price: 6.5, category: 'Desserts', prepTime: '7 min' },
  { id: 'p10', name: 'Binary Cheesecake', price: 7.0, category: 'Desserts', prepTime: '5 min' },
  { id: 'p11', name: 'Node.js Fudge Cake', price: 6.0, category: 'Desserts', prepTime: '4 min' },
  { id: 'p12', name: 'Glitch Donut Box (4pcs)', price: 8.0, category: 'Desserts', prepTime: '2 min' },
  { id: 'p13', name: 'Vaporwave Soda', price: 2.5, category: 'Drinks', prepTime: '1 min' },
  { id: 'p14', name: 'Matrix Iced Tea', price: 3.0, category: 'Drinks', prepTime: '2 min' },
  { id: 'p15', name: 'Plasma Energy Juice', price: 4.0, category: 'Drinks', prepTime: '3 min' },
  { id: 'p16', name: 'Zero-G Mineral Water', price: 1.5, category: 'Drinks', prepTime: '1 min' }
];

const INITIAL_INVOICES = [
  {
    id: 'INV-2026-001',
    orderId: 'ORD-101',
    timestamp: '2026-06-14T08:15:00',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 2, price: 3.5 },
      { product: INITIAL_PRODUCTS[4], quantity: 1, price: 10.5 }
    ],
    subtotal: 17.5,
    tax: 2.63,
    total: 20.13,
    country: 'SA',
    source: 'walk-in',
    qrData: 'CyShop SA Invoice INV-2026-001 | VAT 30045812900003 | Total: 20.13 SAR'
  },
  {
    id: 'INV-2026-002',
    orderId: 'ORD-102',
    timestamp: '2026-06-14T08:45:00',
    items: [
      { product: INITIAL_PRODUCTS[5], quantity: 2, price: 12.0 },
      { product: INITIAL_PRODUCTS[13], quantity: 2, price: 3.0 }
    ],
    subtotal: 30.0,
    tax: 4.8,
    total: 34.8,
    country: 'JO',
    source: 'walk-in',
    qrData: 'CyShop JO Invoice INV-2026-002 | VAT 400129841 | Total: 34.80 JOD'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-101',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 2, price: 3.5 },
      { product: INITIAL_PRODUCTS[4], quantity: 1, price: 10.5 }
    ],
    total: 20.13,
    status: 'ready',
    timestamp: '2026-06-14T08:15:00',
    invoiceId: 'INV-2026-001',
    country: 'SA',
    source: 'walk-in'
  },
  {
    id: 'ORD-102',
    items: [
      { product: INITIAL_PRODUCTS[5], quantity: 2, price: 12.0 },
      { product: INITIAL_PRODUCTS[13], quantity: 2, price: 3.0 }
    ],
    total: 34.8,
    status: 'cooking',
    timestamp: '2026-06-14T08:45:00',
    invoiceId: 'INV-2026-002',
    country: 'JO',
    source: 'walk-in'
  },
  {
    id: 'ORD-103',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1, price: 4.25 },
      { product: INITIAL_PRODUCTS[9], quantity: 1, price: 7.0 }
    ],
    total: 12.94,
    status: 'pending',
    timestamp: '2026-06-14T09:10:00',
    invoiceId: 'INV-2026-003',
    country: 'SA',
    source: 'walk-in'
  }
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST-001', name: 'Ahmad Al-Subaie', phone: '+966 50 123 4567', points: 350, tier: 'VIP' },
  { id: 'CUST-002', name: 'Rania Haddad', phone: '+962 7 9876 5432', points: 120, tier: 'Regular' },
  { id: 'CUST-003', name: 'Khalid Mansour', phone: '+966 54 987 6543', points: 580, tier: 'VIP' },
  { id: 'CUST-004', name: 'Yasmeen Toukan', phone: '+962 7 8123 4567', points: 210, tier: 'Gold' }
];

const INITIAL_STAFF = [
  { id: 'STF-01', name: 'Faisal Jameel', role: 'Cashier', activeShift: true, clockInTime: '08:00 AM' },
  { id: 'STF-02', name: 'Sarah Al-Harbi', role: 'Kitchen Chef', activeShift: true, clockInTime: '07:30 AM' },
  { id: 'STF-03', name: 'Tareq Qabil', role: 'Delivery Agent', activeShift: false, clockInTime: '-' }
];

// Interactive WebGL/Canvas Avatar component
function NovaAvatarCanvas({ avatar, expression, speaking }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2 - 20;

      // Draw Neural Background Grid — CYBERCOM cyan grid
      ctx.strokeStyle = 'rgba(89, 195, 225, 0.07)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Draw Holographic Orbit Rings (Core mode or background)
      if (avatar === 'core') {
        // Outer orange ring
        ctx.strokeStyle = 'rgba(237, 108, 0, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 80 + Math.sin(time) * 5, 80 + Math.cos(time) * 5, time * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Inner cyan ring
        ctx.strokeStyle = 'rgba(89, 195, 225, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 110 + Math.cos(time * 0.8) * 8, 50 + Math.sin(time * 0.8) * 4, -time * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsating Center Core — orange to cyan
        const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 40 + Math.sin(time * 4) * 3);
        gradient.addColorStop(0, '#ff8c35');
        gradient.addColorStop(0.5, 'rgba(237, 108, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(89, 195, 225, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 45 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Neural network nodes — cyan
        ctx.fillStyle = '#59c3e1';
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3 + time * 0.2;
          const px = cx + Math.cos(angle) * (80 + Math.sin(time) * 5);
          const py = cy + Math.sin(angle) * (80 + Math.sin(time) * 5);
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(237, 108, 0, 0.2)';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      } else {
        // Draw human avatars
        
        // Face outline & Neck
        ctx.fillStyle = '#f5d0a9';
        ctx.beginPath();
        ctx.rect(cx - 15, cy + 50, 30, 40);
        ctx.fill();

        // Shoulders & Clothes
        ctx.beginPath();
        if (avatar === 'executive') {
          ctx.fillStyle = '#1e3a8a'; // Blue Suit
          ctx.moveTo(cx - 70, cy + 90);
          ctx.quadraticCurveTo(cx, cy + 70, cx + 70, cy + 90);
          ctx.lineTo(cx + 80, height);
          ctx.lineTo(cx - 80, height);
          ctx.closePath();
          ctx.fill();

          // Tie
          ctx.fillStyle = '#dc2626'; // Red tie
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy + 85);
          ctx.lineTo(cx + 6, cy + 85);
          ctx.lineTo(cx + 10, height - 30);
          ctx.lineTo(cx, height - 10);
          ctx.lineTo(cx - 10, height - 30);
          ctx.closePath();
          ctx.fill();
        } else if (avatar === 'doctor') {
          ctx.fillStyle = '#f8fafc'; // White lab coat
          ctx.moveTo(cx - 70, cy + 90);
          ctx.quadraticCurveTo(cx, cy + 70, cx + 70, cy + 90);
          ctx.lineTo(cx + 80, height);
          ctx.lineTo(cx - 80, height);
          ctx.closePath();
          ctx.fill();

          // Shirt
          ctx.fillStyle = '#0284c7'; // Blue shirt
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy + 80);
          ctx.lineTo(cx + 10, cy + 80);
          ctx.lineTo(cx, cy + 95);
          ctx.closePath();
          ctx.fill();
        } else if (avatar === 'chef') {
          ctx.fillStyle = '#f1f5f9'; // Chef coat
          ctx.moveTo(cx - 70, cy + 90);
          ctx.quadraticCurveTo(cx, cy + 70, cx + 70, cy + 90);
          ctx.lineTo(cx + 80, height);
          ctx.lineTo(cx - 80, height);
          ctx.closePath();
          ctx.fill();

          // Scarf
          ctx.fillStyle = '#ea580c'; // Red-orange scarf
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy + 75);
          ctx.quadraticCurveTo(cx, cy + 85, cx + 20, cy + 75);
          ctx.lineTo(cx + 10, cy + 90);
          ctx.lineTo(cx - 10, cy + 90);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#065f46'; // Green blazer
          ctx.moveTo(cx - 70, cy + 90);
          ctx.quadraticCurveTo(cx, cy + 70, cx + 70, cy + 90);
          ctx.lineTo(cx + 80, height);
          ctx.lineTo(cx - 80, height);
          ctx.closePath();
          ctx.fill();
        }

        // Face circle
        ctx.fillStyle = '#ffedd5';
        if (avatar === 'doctor') ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Blinking dynamically)
        const isBlinking = Math.sin(time) > 0.97;
        ctx.fillStyle = '#1e293b';
        if (isBlinking) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 16, cy - 8);
          ctx.lineTo(cx - 8, cy - 8);
          ctx.moveTo(cx + 8, cy - 8);
          ctx.lineTo(cx + 16, cy - 8);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(cx - 12, cy - 8, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + 12, cy - 8, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyebrows
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy - 16);
        ctx.quadraticCurveTo(cx - 12, cy - 18, cx - 6, cy - 15);
        ctx.moveTo(cx + 6, cy - 15);
        ctx.quadraticCurveTo(cx + 12, cy - 18, cx + 18, cy - 16);
        ctx.stroke();

        // Glasses
        if (avatar === 'executive' || avatar === 'doctor') {
          ctx.strokeStyle = avatar === 'executive' ? '#0f172a' : '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx - 12, cy - 8, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + 12, cy - 8, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 2, cy - 8);
          ctx.lineTo(cx + 2, cy - 8);
          ctx.stroke();
        }

        // Nose
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx - 3, cy + 10);
        ctx.lineTo(cx + 2, cy + 10);
        ctx.stroke();

        // Mouth (Phonetic lip-sync when speaking)
        ctx.fillStyle = '#be123c';
        if (speaking) {
          const mouthOpenHeight = 5 + Math.abs(Math.sin(time * 12)) * 10;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 22, 10, mouthOpenHeight / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Smiling expression
          ctx.strokeStyle = '#be123c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          if (expression === 'smiling') {
            ctx.arc(cx, cy + 18, 12, 0, Math.PI);
          } else {
            ctx.moveTo(cx - 10, cy + 22);
            ctx.quadraticCurveTo(cx, cy + 26, cx + 10, cy + 22);
          }
          ctx.stroke();
        }

        // Hair / Hat
        if (avatar === 'chef') {
          // Chef Hat
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 38, cy - 40);
          ctx.bezierCurveTo(cx - 50, cy - 85, cx - 20, cy - 105, cx, cy - 85);
          ctx.bezierCurveTo(cx + 20, cy - 105, cx + 50, cy - 85, cx + 38, cy - 40);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Hat base band
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.rect(cx - 38, cy - 45, 76, 12);
          ctx.fill();
          ctx.stroke();
        } else if (avatar === 'executive') {
          // Business Executive Hair
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(cx, cy - 40, 24, Math.PI, 0);
          ctx.ellipse(cx - 38, cy - 20, 16, 26, 0.4, 0, Math.PI * 2);
          ctx.ellipse(cx + 38, cy - 20, 16, 26, -0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (avatar === 'doctor') {
          // Professional Silver Hair
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(cx, cy - 36, 26, Math.PI, 0);
          ctx.ellipse(cx - 36, cy - 15, 14, 22, 0.2, 0, Math.PI * 2);
          ctx.ellipse(cx + 36, cy - 15, 14, 22, -0.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Headset and hair for Manager
          ctx.fillStyle = '#7c2d12'; // Brown hair
          ctx.beginPath();
          ctx.arc(cx, cy - 35, 27, Math.PI, 0);
          ctx.ellipse(cx - 38, cy - 15, 14, 24, 0.1, 0, Math.PI * 2);
          ctx.ellipse(cx + 38, cy - 15, 14, 24, -0.1, 0, Math.PI * 2);
          ctx.fill();

          // Headset band
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy - 10, 48, Math.PI, Math.PI * 2);
          ctx.stroke();

          // Mic arm
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + 46, cy + 5);
          ctx.lineTo(cx + 18, cy + 24);
          ctx.stroke();
          
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cx + 18, cy + 24, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Voice Activation Wave Ring
      if (speaking) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 140 + Math.sin(time * 6) * 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 165 + Math.cos(time * 5) * 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [avatar, expression, speaking]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '240px', borderRadius: '12px', background: 'radial-gradient(circle, var(--bg-card-hover) 0%, var(--bg-card) 100%)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width="320" height="240" style={{ width: '320px', height: '240px' }} />
      {/* Neural status node */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: speaking ? 'var(--success-color)' : 'var(--ai-glow-color)' }} />
        <span style={{ fontSize: '9px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>
          {speaking ? 'TRANSMITTING VOICE' : 'NOVA SECURE NODE'}
        </span>
      </div>
    </div>
  );
}

function App() {
  // Navigation & Preferences State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [country, setCountry] = useState('SA'); // SA or JO
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Core Data States
  // Initial products setup with images
  const initialProductsWithImages = INITIAL_PRODUCTS.map((p) => {
    let image = '';
    if (p.category === 'Coffee') image = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60';
    else if (p.category === 'Mains') image = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60';
    else if (p.category === 'Desserts') image = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=60';
    else if (p.category === 'Drinks') image = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?w=150&auto=format&fit=crop&q=60';
    return { ...p, image };
  });

  // Core Data States
  const [products, setProducts] = useState(initialProductsWithImages);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [cart, setCart] = useState([]);
  const [posCategory, setPosCategory] = useState('All');

  // Inventory Management State
  const [inventory, setInventory] = useState(
    initialProductsWithImages.map((p, idx) => ({
      product: p,
      stock: 50 + ((idx * 8) % 45),
      minStock: 20
    }))
  );

  // Selected details
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('INV-2026-001');
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-001');
  const [generatedVoucher, setGeneratedVoucher] = useState(null);

  // Forms states
  const [newProdName, setNewProdName] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Coffee');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('50');

  // Kiosk & QR Menu States
  const [kioskCart, setKioskCart] = useState([]);
  const [kioskCategory, setKioskCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPoints, setNewCustPoints] = useState('100');
  const [newCustTier, setNewCustTier] = useState('Regular');

  // Talabat Integration State
  const [talabatConnected, setTalabatConnected] = useState(true);
  const [talabatAutoAccept, setTalabatAutoAccept] = useState(true);
  const [talabatMerchantId, setTalabatMerchantId] = useState('TLB-CyShop-AMM');
  const [talabatCommission, setTalabatCommission] = useState('20'); // 20% commission fee
  const [talabatIntegrationName, setTalabatIntegrationName] = useState('CyShop Jordan');
  const [talabatIntegrationCode, setTalabatIntegrationCode] = useState('cyshop-jo');
  const [talabatBaseUrl, setTalabatBaseUrl] = useState('https://api.cyshop.jo/v1/integrations/talabat');
  const [talabatPluginUsername, setTalabatPluginUsername] = useState('cyshop-jo-username');
  const [talabatChainName, setTalabatChainName] = useState('CyShop Retail');
  const [talabatChainCode, setTalabatChainCode] = useState('cyshop-retail-chain');
  const [talabatVendorCode, setTalabatVendorCode] = useState('TLB-CyShop-AMM');
  const [talabatRemoteId, setTalabatRemoteId] = useState('123456');

  // Careem & ZATCA Onboarding Credentials State
  const [careemEnabled, setCareemEnabled] = useState(true);
  const [careemMerchantId, setCareemMerchantId] = useState('CRM-CyShop-AMM');
  const [careemVendorCode, setCareemVendorCode] = useState('CRM-VND-02');
  const [careemBaseUrl, setCareemBaseUrl] = useState('https://api.careem.com/v1/pos');
  const [careemApiKey, setCareemApiKey] = useState('crm_api_key_88f9a2b7');
  const [careemConnected, setCareemConnected] = useState(true);

  const [zatcaClientId, setZatcaClientId] = useState('ZATCA-CL-88291');
  const [zatcaSecret, setZatcaSecret] = useState('ztc_sec_99a8b7c6d5');
  const [zatcaCsid, setZatcaCsid] = useState('CSID-2026-98124');
  const [zatcaConnected, setZatcaConnected] = useState(true);

  const [talabatClientId, setTalabatClientId] = useState('client_cyshop_prod_99');
  const [talabatClientSecret, setTalabatClientSecret] = useState('sec_d5f8a096f2ad74f199f94');
  const [talabatAccessToken, setTalabatAccessToken] = useState('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZWxpdmVyeWhlcm8iLCJleHAiOjE3ODQwMDAwMDB9.xXyZ...');
  const [talabatTokenStatus, setTalabatTokenStatus] = useState('Active');
  const [requestingToken, setRequestingToken] = useState(false);

  const [talabatPublicKey, setTalabatPublicKey] = useState(
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    'Version: GnuPG v2.4.5 (Wing32)\n' +
    'Comment: CyShop Talabat POS Integration Key\n\n' +
    'mQINBGN1SxgBEADOp1L3hQ9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1\n' +
    'nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK8vJ8\n' +
    'vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9\n' +
    'v8p1nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK\n' +
    '-----END PGP PUBLIC KEY BLOCK-----'
  );
  const [talabatPrivateKey, setTalabatPrivateKey] = useState(
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
    'Version: GnuPG v2.4.5 (Wing32)\n\n' +
    'MIIJqgIBAzNDBglghkgBZQMEAS4wEQQMk665Vb2e6vM20h8AAgEAMIICmgYJKoZI\n' +
    'hvcNAQcGoIICizCCAocCAQAwggKEBgkqhkiG9w0BBwEwHQYJYIZIAWUDBAEqBBDj\n' +
    'sD5B2/d84y8v6jD9e7eXgICChHq7x+K1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8o\n' +
    '-----END PGP PRIVATE KEY BLOCK-----'
  );
  const [regeneratingPgp, setRegeneratingPgp] = useState(false);
  const [activeTalabatSubTab, setActiveTalabatSubTab] = useState('general');
  const [pingStates, setPingStates] = useState({});
  const [pingLatencies, setPingLatencies] = useState({});

  // Project Nova States
  const [selectedAvatar, setSelectedAvatar] = useState('executive'); // executive, doctor, chef, manager, core
  const [avatarExpression, setAvatarExpression] = useState('neutral'); // neutral, smiling, talking, pointing
  const [novaVoiceActive, setNovaVoiceActive] = useState(false);
  const [novaSpeaking, setNovaSpeaking] = useState(false);
  const [novaQuery, setNovaQuery] = useState('');
  const [novaDialog, setNovaDialog] = useState('Welcome! I am your Nova AI Avatar Assistant. Select an identity below or speak to me directly. I can query ERP databases, process autonomous actions, or run e-commerce checkouts.');
  const [autonomousActions, setAutonomousActions] = useState([
    { id: 1, type: 'po', label: 'Draft purchase order - 50 bags Coffee', status: 'completed', time: '10:02 AM' },
    { id: 2, type: 'leave', label: 'Approve annual leave - Faisal Jameel', status: 'completed', time: '10:05 AM' }
  ]);
  const [actionProgress, setActionProgress] = useState(null); // { label, percent }
  const [deliveryQuery, setDeliveryQuery] = useState('burger promotions');
  const [deliveryResults, setDeliveryResults] = useState([
    { id: 'd1', name: 'Cyber Burger Joint', promo: '30% Off Family Meal', price: 9.50, distance: '1.2 km', logo: '🍔' },
    { id: 'd2', name: 'Matrix Pizza slices', promo: 'Buy 1 Get 1 Free', price: 12.00, distance: '2.5 km', logo: '🍕' },
    { id: 'd3', name: 'Synth Cafe & Bakery', promo: 'Free Coffee with Donut Box', price: 8.00, distance: '0.8 km', logo: '☕' }
  ]);
  const [activeNovaSubTab, setActiveNovaSubTab] = useState('erp'); // erp, delivery, benchmark, blueprints

  // System Configs Settings State
  const [storeName, setStoreName] = useState('CYSHOP RETAIL LTD');
  const [zatcaSandbox, setZatcaSandbox] = useState(true);
  const [istdEnabled, setIstdEnabled] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [defaultVatJo, setDefaultVatJo] = useState('16');
  const [defaultVatSa, setDefaultVatSa] = useState('15');
  const [jofotaraUsername, setJofotaraUsername] = useState('EGS-JO-59821');
  const [jofotaraSecret, setJofotaraSecret] = useState('d3f82a7b9e1c4f03a6b5c7d8e9f0a1b2');
  const [jofotaraSeqNumber, setJofotaraSeqNumber] = useState('1');
  const [jofotaraEndpoint, setJofotaraEndpoint] = useState('sandbox'); // sandbox, production
  const [jofotaraConnected, setJofotaraConnected] = useState(true);

  // AWS Cloud Services State
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('AKIAIOSFODNN7EXAMPLE');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [awsS3Bucket, setAwsS3Bucket] = useState('cyshop-pos-backups');
  const [awsDynamoTable, setAwsDynamoTable] = useState('cyshop-transactions-prod');
  const [awsConnected, setAwsConnected] = useState(true);
  const [awsAutoSync, setAwsAutoSync] = useState(true);
  const [awsStaticHosting, setAwsStaticHosting] = useState(false);
  const [isAwsVerifying, setIsAwsVerifying] = useState(false);
  const [isAwsSyncing, setIsAwsSyncing] = useState(false);
  const [awsSyncProgress, setAwsSyncProgress] = useState(null); // { label: string, percent: number }

  // ─── HR Module State ─────────────────────────────────────────────
  const [employees, setEmployees] = useState([
    { id: 'EMP-001', name: 'Faisal Jameel', dept: 'Operations', role: 'Cashier', status: 'Active', startDate: '2024-01-15', baseSalary: 1800, allowances: 300, email: 'faisal@cyshop.com', phone: '+966 50 111 2222', leaveBalance: 15, nationalId: '1099887766', contractType: 'Full-Time', hourlyRate: 0, overtimeMultiplier: 1.5, healthPremium: 100, employerHealthShare: 80 },
    { id: 'EMP-002', name: 'Sarah Al-Harbi', dept: 'Kitchen', role: 'Head Chef', status: 'Active', startDate: '2023-06-01', baseSalary: 2400, allowances: 450, email: 'sarah@cyshop.com', phone: '+966 55 333 4444', leaveBalance: 12, nationalId: '2087654321', contractType: 'Full-Time', hourlyRate: 0, overtimeMultiplier: 1.5, healthPremium: 120, employerHealthShare: 100 },
    { id: 'EMP-003', name: 'Tareq Qabil', dept: 'Delivery', role: 'Rider', status: 'On Leave', startDate: '2024-03-20', baseSalary: 0, allowances: 200, email: 'tareq@cyshop.com', phone: '+966 50 555 6666', leaveBalance: 8, nationalId: '1076543219', contractType: 'Hourly', hourlyRate: 12.50, overtimeMultiplier: 1.5, healthPremium: 80, employerHealthShare: 50 },
    { id: 'EMP-004', name: 'Layla Al-Rashid', dept: 'Finance', role: 'Accountant', status: 'Active', startDate: '2022-09-01', baseSalary: 3200, allowances: 600, email: 'layla@cyshop.com', phone: '+962 7 9111 2222', leaveBalance: 21, nationalId: '400129841', contractType: 'Full-Time', hourlyRate: 0, overtimeMultiplier: 1.5, healthPremium: 150, employerHealthShare: 80 },
    { id: 'EMP-005', name: 'Ahmad Mansour', dept: 'IT', role: 'System Admin', status: 'Active', startDate: '2023-11-15', baseSalary: 1900, allowances: 250, email: 'ahmad@cyshop.com', phone: '+966 54 777 8888', leaveBalance: 18, nationalId: '1065432187', contractType: 'Part-Time', hourlyRate: 0, overtimeMultiplier: 1.5, healthPremium: 95, employerHealthShare: 70 }
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hrTab, setHrTab] = useState('directory');
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 'LV-001', empId: 'EMP-001', empName: 'Faisal Jameel', type: 'Annual', from: '2026-06-18', to: '2026-06-22', days: 5, status: 'Pending', reason: 'Family vacation' },
    { id: 'LV-002', empId: 'EMP-003', empName: 'Tareq Qabil', type: 'Sick', from: '2026-06-15', to: '2026-06-17', days: 3, status: 'Approved', reason: 'Medical treatment' }
  ]);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Operations');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState('');
  const [newEmpAllowance, setNewEmpAllowance] = useState('');
  const [newEmpContractType, setNewEmpContractType] = useState('Full-Time');
  const [newEmpHourlyRate, setNewEmpHourlyRate] = useState('15');
  const [newEmpOvertimeMultiplier, setNewEmpOvertimeMultiplier] = useState('1.5');
  const [newEmpHealthPremium, setNewEmpHealthPremium] = useState('100');
  const [newEmpEmployerHealthShare, setNewEmpEmployerHealthShare] = useState('80');

  // ─── Attendance Module State ──────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [attendanceLogs, setAttendanceLogs] = useState([
    { id: 'ATT-001', empId: 'EMP-001', empName: 'Faisal Jameel', date: today, clockIn: '08:02', clockOut: '17:05', hoursWorked: 9.05, regularHours: 8.0, overtimeHours: 1.05, approvalStatus: 'Approved', status: 'Present', gps: '24.7136° N, 46.6753° E' },
    { id: 'ATT-002', empId: 'EMP-002', empName: 'Sarah Al-Harbi', date: today, clockIn: '07:30', clockOut: null, hoursWorked: null, regularHours: 0, overtimeHours: 0, approvalStatus: 'Pending', status: 'Active', gps: '24.7136° N, 46.6753° E' },
    { id: 'ATT-003', empId: 'EMP-004', empName: 'Layla Al-Rashid', date: today, clockIn: '09:15', clockOut: null, hoursWorked: null, regularHours: 0, overtimeHours: 0, approvalStatus: 'Pending', status: 'Late', gps: '31.9539° N, 35.9106° E' }
  ]);
  const [attendanceMonth, setAttendanceMonth] = useState('2026-06');
  const [clockingEmployee, setClockingEmployee] = useState('EMP-001');

  // ─── Payroll Module State ─────────────────────────────────────────
  const [payrollRuns, setPayrollRuns] = useState([
    { id: 'PAY-2026-05', month: 'May 2026', processedDate: '2026-05-28', employees: 5, totalGross: 13900, totalDeductions: 1390, totalNet: 12510, status: 'Paid' },
    { id: 'PAY-2026-04', month: 'April 2026', processedDate: '2026-04-28', employees: 5, totalGross: 13900, totalDeductions: 1390, totalNet: 12510, status: 'Paid' }
  ]);
  const [payrollTab, setPayrollTab] = useState('current');
  const [payrollProcessing, setPayrollProcessing] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('June 2026');

  // ─── Accounting Module State ──────────────────────────────────────
  const [accountingTab, setAccountingTab] = useState('ledger');
  const INITIAL_CHARTS = [
    { code: '1001', name: 'Cash & Bank', type: 'Asset', baseBalance: 101075.57 },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset', baseBalance: 12850.00 },
    { code: '1200', name: 'Inventory Assets', type: 'Asset', baseBalance: 34622.47 },
    { code: '2001', name: 'Accounts Payable', type: 'Liability', baseBalance: 8750.00 },
    { code: '2100', name: 'VAT Payable', type: 'Liability', baseBalance: 6400.00 },
    { code: '2200', name: 'Salary Payable', type: 'Liability', baseBalance: 12510.00 },
    { code: '2300', name: 'Payroll Liabilities', type: 'Liability', baseBalance: 0.00 },
    { code: '3001', name: 'Owner Equity', type: 'Equity', baseBalance: 108410.50 },
    { code: '4001', name: 'Sales Revenue', type: 'Revenue', baseBalance: 145545.07 },
    { code: '4100', name: 'Delivery Revenue', type: 'Revenue', baseBalance: 18400.00 },
    { code: '5001', name: 'Cost of Goods Sold', type: 'Expense', baseBalance: 52277.53 },
    { code: '5100', name: 'Salaries Expense', type: 'Expense', baseBalance: 55540.00 },
    { code: '5200', name: 'Rent Expense', type: 'Expense', baseBalance: 14400.00 },
    { code: '5300', name: 'Utilities Expense', type: 'Expense', baseBalance: 4800.00 }
  ];
  const [journalEntries, setJournalEntries] = useState([
    { id: 'JE-001', date: '2026-06-14', description: 'POS Cash Sales - Saudi Branch', debitAccount: '1001 Cash & Bank', creditAccount: '4001 Sales Revenue', debitAmount: 20.13, creditAmount: 20.13, ref: 'INV-2026-001' },
    { id: 'JE-002', date: '2026-06-14', description: 'POS Cash Sales - Jordan Branch', debitAccount: '1001 Cash & Bank', creditAccount: '4001 Sales Revenue', debitAmount: 34.80, creditAmount: 34.80, ref: 'INV-2026-002' },
    { id: 'JE-003', date: '2026-06-14', description: 'COGS - Raw material consumed', debitAccount: '5001 Cost of Goods Sold', creditAccount: '1200 Inventory Assets', debitAmount: 22.47, creditAmount: 22.47, ref: 'ORD-101' },
    { id: 'JE-004', date: '2026-05-31', description: 'Monthly Salaries Disbursed', debitAccount: '5100 Salaries Expense', creditAccount: '1001 Cash & Bank', debitAmount: 12510, creditAmount: 12510, ref: 'PAY-2026-05' },
    { id: 'JE-005', date: '2026-05-31', description: 'VAT Settlement - ZATCA Portal', debitAccount: '2100 VAT Payable', creditAccount: '1001 Cash & Bank', debitAmount: 3200, creditAmount: 3200, ref: 'ZATCA-2026-05' }
  ]);

  const chartOfAccounts = INITIAL_CHARTS.map(account => {
    let balance = account.baseBalance;
    journalEntries.forEach(je => {
      const debited = je.debitAccount.startsWith(account.code);
      const credited = je.creditAccount.startsWith(account.code);
      if (debited || credited) {
        const change = je.debitAmount;
        if (account.type === 'Asset' || account.type === 'Expense') {
          if (debited) balance += change;
          if (credited) balance -= change;
        } else {
          if (credited) balance += change;
          if (debited) balance -= change;
        }
      }
    });
    return { ...account, balance };
  });
  const [newJEDesc, setNewJEDesc] = useState('');
  const [newJEDebit, setNewJEDebit] = useState('');
  const [newJECredit, setNewJECredit] = useState('');
  const [newJEAmount, setNewJEAmount] = useState('');

  // Overhead Expenses Form States
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseAccount, setExpenseAccount] = useState('5200 Rent Expense');
  const [expenseDate, setExpenseDate] = useState(today);

  // Sync selected employee to add/edit form
  useEffect(() => {
    if (selectedEmployee) {
      setNewEmpName(selectedEmployee.name || '');
      setNewEmpDept(selectedEmployee.dept || 'Operations');
      setNewEmpRole(selectedEmployee.role || '');
      setNewEmpSalary(selectedEmployee.baseSalary?.toString() || '');
      setNewEmpAllowance(selectedEmployee.allowances?.toString() || '');
      setNewEmpContractType(selectedEmployee.contractType || 'Full-Time');
      setNewEmpHourlyRate(selectedEmployee.hourlyRate?.toString() || '0');
      setNewEmpOvertimeMultiplier(selectedEmployee.overtimeMultiplier?.toString() || '1.5');
      setNewEmpHealthPremium(selectedEmployee.healthPremium?.toString() || '100');
      setNewEmpEmployerHealthShare(selectedEmployee.employerHealthShare?.toString() || '80');
    } else {
      setNewEmpName('');
      setNewEmpDept('Operations');
      setNewEmpRole('');
      setNewEmpSalary('');
      setNewEmpAllowance('');
      setNewEmpContractType('Full-Time');
      setNewEmpHourlyRate('15');
      setNewEmpOvertimeMultiplier('1.5');
      setNewEmpHealthPremium('100');
      setNewEmpEmployerHealthShare('80');
    }
  }, [selectedEmployee, hrTab]);

  const getPayrollMonthPrefix = (monthStr) => {
    const monthsMap = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const parts = monthStr.split(' ');
    if (parts.length === 2) {
      const monthName = parts[0];
      const year = parts[1];
      const monthNum = monthsMap[monthName];
      if (monthNum) return `${year}-${monthNum}`;
    }
    return '2026-06';
  };

  const calculateEmployeePayroll = (emp) => {
    const monthPrefix = getPayrollMonthPrefix(payrollMonth);
    let baseSalary = emp.baseSalary;
    let regHours = 0;
    let otHours = 0;

    if (emp.contractType === 'Hourly') {
      const empLogs = attendanceLogs.filter(
        a => a.empId === emp.id && a.approvalStatus === 'Approved' && a.date.startsWith(monthPrefix)
      );
      regHours = empLogs.reduce((s, a) => s + (a.regularHours || 0), 0);
      otHours = empLogs.reduce((s, a) => s + (a.overtimeHours || 0), 0);
      baseSalary = (regHours * (emp.hourlyRate || 0)) + (otHours * (emp.hourlyRate || 0) * (emp.overtimeMultiplier || 1.5));
    }

    const gross = baseSalary + (emp.allowances || 0);
    const healthPremium = emp.healthPremium || 0;
    const employerHealthShare = emp.employerHealthShare !== undefined ? emp.employerHealthShare : 100;
    
    const employerHealth = healthPremium * (employerHealthShare / 100);
    const employeeHealth = healthPremium * (1 - employerHealthShare / 100);

    const employeeSSC = gross * 0.075;
    const employerSSC = gross * 0.1425;

    const taxableGross = Math.max(0, gross - employeeHealth - employeeSSC);
    const incomeTax = taxableGross * 0.05;

    const net = gross - employeeHealth - employeeSSC - incomeTax;
    const employerCTC = gross + employerSSC + employerHealth;
    const deductions = employeeHealth + employeeSSC + incomeTax;

    return {
      empId: emp.id,
      name: emp.name,
      role: emp.role,
      contractType: emp.contractType,
      baseSalary,
      allowances: emp.allowances || 0,
      gross,
      employerHealth,
      employeeHealth,
      employeeSSC,
      employerSSC,
      taxableGross,
      incomeTax,
      net,
      employerCTC,
      deductions,
      regHours,
      otHours
    };
  };

  const payrollList = employees.map(emp => calculateEmployeePayroll(emp));
  const totalGross = payrollList.reduce((sum, p) => sum + p.gross, 0);
  const totalDeductions = payrollList.reduce((sum, p) => sum + p.deductions, 0);
  const totalNet = payrollList.reduce((sum, p) => sum + p.net, 0);
  const totalLiabilities = payrollList.reduce((sum, p) => sum + p.employeeHealth + p.employeeSSC + p.incomeTax + p.employerSSC + p.employerHealth, 0);
  const totalEmployerCTC = payrollList.reduce((sum, p) => sum + p.employerCTC, 0);

  // ─── Inventory BOM / Kits State ───────────────────────────────────
  const [inventoryTab, setInventoryTab] = useState('stock');
  const [bomItems, setBomItems] = useState([
    { id: 'BOM-001', name: 'CyBurger Premium Kit', type: 'Kit', components: [
      { name: 'Burger Bun', qty: 1, unit: 'pcs', cost: 0.50 },
      { name: 'Beef Patty 150g', qty: 1, unit: 'pcs', cost: 3.20 },
      { name: 'Cheddar Cheese', qty: 2, unit: 'slices', cost: 0.30 },
      { name: 'Fresh Lettuce', qty: 15, unit: 'g', cost: 0.10 },
      { name: 'Tomato', qty: 2, unit: 'slices', cost: 0.15 },
      { name: 'Special Sauce', qty: 20, unit: 'ml', cost: 0.25 }
    ], totalCost: 4.50, sellPrice: 10.50, margin: 57.1 },
    { id: 'BOM-002', name: 'Synth Pizza Margherita Kit', type: 'Kit', components: [
      { name: 'Pizza Dough 250g', qty: 1, unit: 'pcs', cost: 1.20 },
      { name: 'Tomato Sauce', qty: 80, unit: 'ml', cost: 0.40 },
      { name: 'Mozzarella Cheese', qty: 100, unit: 'g', cost: 1.80 },
      { name: 'Fresh Basil', qty: 5, unit: 'leaves', cost: 0.20 }
    ], totalCost: 3.60, sellPrice: 12.00, margin: 70.0 },
    { id: 'BOM-003', name: 'Cyber Espresso Raw Material', type: 'Raw', components: [
      { name: 'Arabica Coffee Beans', qty: 18, unit: 'g', cost: 0.72 },
      { name: 'Filtered Water', qty: 30, unit: 'ml', cost: 0.02 }
    ], totalCost: 0.74, sellPrice: 3.50, margin: 78.9 }
  ]);
  const [selectedBom, setSelectedBom] = useState(null);
  const [bomTab, setBomTab] = useState('list');

  // ─── Supply Chain / Purchase Orders State ─────────────────────────
  const [supplyTab, setSupplyTab] = useState('vendors');
  const [vendors, setVendors] = useState([
    { id: 'VND-001', name: 'Al-Jazeera Food Supplies', contact: '+966 11 234 5678', country: 'SA', rating: 4.8, category: 'Food & Beverage', paymentTerms: 'Net 30', leadTime: '2 days' },
    { id: 'VND-002', name: 'Jordan Fresh Foods Co.', contact: '+962 6 567 8901', country: 'JO', rating: 4.5, category: 'Fresh Produce', paymentTerms: 'Net 15', leadTime: '1 day' },
    { id: 'VND-003', name: 'Gulf Packaging Corp.', contact: '+966 12 345 6789', country: 'SA', rating: 4.2, category: 'Packaging', paymentTerms: 'Net 45', leadTime: '5 days' }
  ]);
  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: 'PO-2026-001', vendor: 'Al-Jazeera Food Supplies', date: '2026-06-10', items: [{name:'Coffee Beans 1kg',qty:20,price:15.00},{name:'Burger Patties x10',qty:50,price:18.00}], total: 1200.00, status: 'Received', dueDate: '2026-06-13' },
    { id: 'PO-2026-002', vendor: 'Jordan Fresh Foods Co.', date: '2026-06-12', items: [{name:'Fresh Lettuce 1kg',qty:10,price:3.50},{name:'Tomatoes 1kg',qty:15,price:2.00}], total: 65.00, status: 'Pending', dueDate: '2026-06-14' }
  ]);
  const [newPoVendor, setNewPoVendor] = useState('VND-001');
  const [newPoItem, setNewPoItem] = useState('');
  const [newPoQty, setNewPoQty] = useState('');
  const [newPoPrice, setNewPoPrice] = useState('');
  const [poLines, setPoLines] = useState([]);

  // ─── Setup Wizard State ───────────────────────────────────────────
  const [setupStep, setSetupStep] = useState(0);
  const [setupConfig, setSetupConfig] = useState({
    businessName: '', businessType: 'restaurant', currency: 'SAR', country: 'SA',
    vatNumber: '', vatRate: '15', branches: '1', modules: { pos: true, hr: true, accounting: true, inventory: true, delivery: false },
    adminEmail: '', adminPassword: '', logo: ''
  });
  const [setupComplete, setSetupComplete] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // AI Chatbot State
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am CYBERCOM AI — your intelligent ERP assistant. I can analyze sales trends, monitor inventory, configure VAT compliance, or audit your Talabat delivery channel. How can I help?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Sync theme with DOM body
  useEffect(() => {
    const root = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Scroll AI messages to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatTyping]);

  // Currency & Tax Helpers based on settings
  const getCurrency = (c = country) => (c === 'SA' ? 'SAR' : 'JOD');
  const getTaxRate = (c = country) => {
    if (c === 'SA') return parseFloat(defaultVatSa) / 100;
    return parseFloat(defaultVatJo) / 100;
  };

  // Toast notifications
  const triggerToast = (message, type = 'success') => {
    const id = Date.now() + '-' + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Switch Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    triggerToast(`Theme switched to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, 'info');
  };

  // Switch Country
  const [handleCountryToggle, setHandleCountryToggle] = useState(() => (selectedCountry) => {
    setCountry(selectedCountry);
    // Update Talabat Integration Naming defaults dynamically
    if (selectedCountry === 'SA') {
      setTalabatIntegrationName('CyShop Saudi Arabia');
      setTalabatIntegrationCode('cyshop-sa');
      setTalabatBaseUrl('https://api.cyshop.sa/v1/integrations/talabat');
      setTalabatPluginUsername('cyshop-sa-username');
      setTalabatVendorCode('TLB-CyShop-RUH');
      setTalabatMerchantId('TLB-CyShop-RUH');
    } else {
      setTalabatIntegrationName('CyShop Jordan');
      setTalabatIntegrationCode('cyshop-jo');
      setTalabatBaseUrl('https://api.cyshop.jo/v1/integrations/talabat');
      setTalabatPluginUsername('cyshop-jo-username');
      setTalabatVendorCode('TLB-CyShop-AMM');
      setTalabatMerchantId('TLB-CyShop-AMM');
    }
    triggerToast(
      `Region set to ${selectedCountry === 'SA' ? 'Saudi Arabia (SAR)' : 'Jordan (JOD)'}`,
      'info'
    );
  });

  // Add Item to POS Cart
  const addToCart = (product) => {
    const stockItem = inventory.find((item) => item.product.id === product.id);
    if (stockItem && stockItem.stock <= 0) {
      triggerToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }
    
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    triggerToast(`${product.name} added to cart`, 'success');
  };

  // Modify cart item quantity
  const updateCartQuantity = (productId, change) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + change;
            if (change > 0) {
              const stockItem = inventory.find((inv) => inv.product.id === productId);
              if (stockItem && stockItem.stock < newQty) {
                triggerToast(`Maximum stock limit reached for ${item.product.name}`, 'error');
                return item;
              }
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Delete Cart Item
  const removeCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    triggerToast('Item removed from cart', 'info');
  };

  const recordCheckoutJournalEntries = (source, subtotal, tax, invoiceId, items) => {
    let orderCogs = 0;
    items.forEach((item) => {
      const bom = bomItems.find(b => b.name.toLowerCase().includes(item.product.name.toLowerCase()));
      const unitCost = bom ? bom.totalCost : item.product.price * 0.5;
      orderCogs += unitCost * item.quantity;
    });
    orderCogs = parseFloat(orderCogs.toFixed(2));

    const debitAccount = (source === 'talabat' || source === 'careem') ? '1100 Accounts Receivable' : '1001 Cash & Bank';

    const revenueJE = {
      id: `JE-SL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: today,
      description: `POS ${source.toUpperCase()} Sales - Invoice ${invoiceId}`,
      debitAccount,
      creditAccount: '4001 Sales Revenue',
      debitAmount: parseFloat(subtotal.toFixed(2)),
      creditAmount: parseFloat(subtotal.toFixed(2)),
      ref: invoiceId
    };

    const vatJE = {
      id: `JE-VT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: today,
      description: `POS ${source.toUpperCase()} VAT Collected - Invoice ${invoiceId}`,
      debitAccount,
      creditAccount: '2100 VAT Payable',
      debitAmount: parseFloat(tax.toFixed(2)),
      creditAmount: parseFloat(tax.toFixed(2)),
      ref: invoiceId
    };

    const cogsJE = {
      id: `JE-CG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: today,
      description: `POS ${source.toUpperCase()} COGS - Invoice ${invoiceId}`,
      debitAccount: '5001 Cost of Goods Sold',
      creditAccount: '1200 Inventory Assets',
      debitAmount: orderCogs,
      creditAmount: orderCogs,
      ref: invoiceId
    };

    setJournalEntries(prev => [...prev, revenueJE, vatJE, cogsJE]);
  };

  // POS Checkout checkout order
  const handleCheckout = () => {
    if (cart.length === 0) {
      triggerToast('Cart is empty', 'error');
      return;
    }

    let outOfStockNames = [];
    cart.forEach((item) => {
      const invItem = inventory.find((inv) => inv.product.id === item.product.id);
      if (invItem && invItem.stock < item.quantity) {
        outOfStockNames.push(item.product.name);
      }
    });

    if (outOfStockNames.length > 0) {
      triggerToast(`Checkout failed. Insufficient stock: ${outOfStockNames.join(', ')}`, 'error');
      return;
    }

    setInventory((prev) =>
      prev.map((inv) => {
        const cartItem = cart.find((item) => item.product.id === inv.product.id);
        if (cartItem) {
          const remainingStock = inv.stock - cartItem.quantity;
          if (remainingStock <= inv.minStock) {
            setTimeout(() => {
              triggerToast(`Low stock alert: ${inv.product.name} is down to ${remainingStock} items.`, 'error');
            }, 800);
          }
          return { ...inv, stock: remainingStock };
        }
        return inv;
      })
    );

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const taxRate = getTaxRate();
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const orderId = `ORD-${orders.length + 101}`;
    const invoiceId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const newOrder = {
      id: orderId,
      items: cart.map((item) => ({ ...item, price: item.product.price })),
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      timestamp,
      invoiceId,
      country,
      source: 'walk-in'
    };

    const newInvoice = {
      id: invoiceId,
      orderId,
      timestamp,
      items: cart.map((item) => ({ ...item, price: item.product.price })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      country,
      source: 'walk-in',
      qrData: `CyShop ${country} | Inv: ${invoiceId} | VAT ID: ${
        country === 'SA' ? '30045812900003' : '100239485'
      } | Total: ${total.toFixed(2)} ${getCurrency()}`
    };

    setOrders((prev) => [newOrder, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);
    recordCheckoutJournalEntries('walk-in', subtotal, tax, invoiceId, cart);
    setSelectedInvoiceId(invoiceId);
    setCart([]);

    confetti({
      particleCount: 150,
      spread: 75,
      origin: { y: 0.75 }
    });

    triggerToast(`Order checkout complete! Receipt ${invoiceId} sent to KDS.`, 'success');

    // Real-Time E-Invoicing Submission
    if (country === 'JO' && istdEnabled) {
      if (jofotaraConnected && jofotaraUsername && jofotaraSecret) {
        setTimeout(() => {
          triggerToast(`Invoice ${invoiceId} successfully signed & uploaded to Jofotara Portal in UBL 2.1 XML!`, 'success');
        }, 1200);
      } else {
        setTimeout(() => {
          triggerToast(`Warning: Invoice ${invoiceId} recorded locally. Submit to Jofotara failed: Invalid credentials!`, 'warning');
        }, 1200);
      }
    } else if (country === 'SA') {
      if (zatcaConnected && zatcaClientId && zatcaSecret) {
        setTimeout(() => {
          triggerToast(`Invoice ${invoiceId} successfully cleared & signed with Saudi ZATCA API Portal!`, 'success');
        }, 1200);
      } else {
        setTimeout(() => {
          triggerToast(`Warning: Invoice ${invoiceId} recorded locally. Submit to ZATCA failed: Invalid API credentials!`, 'warning');
        }, 1200);
      }
    }

    // AWS Cloud Auto-Sync
    if (awsAutoSync) {
      if (awsConnected && awsAccessKeyId && awsSecretAccessKey) {
        setTimeout(() => {
          triggerToast(`Transaction ${invoiceId} synced to AWS DynamoDB table '${awsDynamoTable}'`, 'success');
          setAutonomousActions(old => [
            {
              id: 'aws-autosync-' + Date.now() + '-' + Math.random(),
              type: 'compliance',
              label: `DynamoDB Record Backup - Invoice ${invoiceId}`,
              status: 'completed',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            ...old
          ]);
        }, 1800);
      } else {
        setTimeout(() => {
          triggerToast(`Auto-Sync Failed: AWS integration offline.`, 'warning');
        }, 1800);
      }
    }
  };

  // Simulate incoming Talabat Delivery Order
  const handleSimulateTalabatOrder = () => {
    if (!talabatConnected) {
      triggerToast('Cannot simulate: Talabat Store Channel is Offline!', 'error');
      return;
    }

    // Select random products (e.g. 1 main and 1 drink)
    const pizzaItem = products.find((p) => p.id === 'p6') || products[4];
    const drinkItem = products.find((p) => p.id === 'p14') || products[13];

    const orderItems = [
      { product: pizzaItem, quantity: 1, price: pizzaItem.price },
      { product: drinkItem, quantity: 2, price: drinkItem.price }
    ];

    const subtotal = pizzaItem.price + drinkItem.price * 2;
    const taxRate = getTaxRate();
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const orderId = `ORD-${orders.length + 101}`;
    const invoiceId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const newOrder = {
      id: orderId,
      items: orderItems,
      total: parseFloat(total.toFixed(2)),
      status: talabatAutoAccept ? 'pending' : 'unaccepted',
      timestamp,
      invoiceId,
      country,
      source: 'talabat',
      deliveryInfo: {
        riderName: 'Talabat Rider #581',
        deliveryAddress: 'Jabal Amman, Block C'
      }
    };

    const newInvoice = {
      id: invoiceId,
      orderId,
      timestamp,
      items: orderItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      country,
      source: 'talabat',
      qrData: `CyShop Talabat ${country} | Inv: ${invoiceId} | VAT ID: ${
        country === 'SA' ? '30045812900003' : '100239485'
      } | Total: ${total.toFixed(2)} ${getCurrency()}`
    };

    // Deduct stock
    setInventory((prev) =>
      prev.map((inv) => {
        const oItem = orderItems.find((item) => item.product.id === inv.product.id);
        if (oItem) {
          return { ...inv, stock: Math.max(0, inv.stock - oItem.quantity) };
        }
        return inv;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);
    recordCheckoutJournalEntries('talabat', subtotal, tax, invoiceId, orderItems);
    setSelectedInvoiceId(invoiceId);

    if (talabatAutoAccept) {
      triggerToast(`New Talabat Order ${orderId} Auto-Accepted & Dispatched to KDS!`, 'success');
      confetti({
        particleCount: 80,
        spread: 50,
        colors: ['#ff6000', '#ffffff']
      });
    } else {
      triggerToast(`Incoming Talabat Delivery Ticket ${orderId} awaits kitchen approval.`, 'info');
    }
  };

  const handleRequestToken = () => {
    setRequestingToken(true);
    triggerToast('Initiating OAuth2 client credentials login flow...', 'info');
    setTimeout(() => {
      setRequestingToken(false);
      const randomToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
        iss: 'deliveryhero',
        client_id: talabatClientId,
        exp: Math.floor(Date.now() / 1000) + 3600
      })) + '.' + Math.random().toString(36).substring(2, 15);
      setTalabatAccessToken(randomToken);
      setTalabatTokenStatus('Active');
      triggerToast('OAuth2 token successfully retrieved and cached!', 'success');
    }, 1500);
  };

  const handleRegeneratePgpKeys = () => {
    setRegeneratingPgp(true);
    triggerToast('Generating secure RSA 4096-bit key pair using GnuPG engine...', 'info');
    setTimeout(() => {
      setRegeneratingPgp(false);
      const keyId = Math.random().toString(16).substring(2, 10).toUpperCase();
      const dummyPublic = 
        `-----BEGIN PGP PUBLIC KEY BLOCK-----\n` +
        `Version: GnuPG v2.4.5 (Wing32)\n` +
        `Comment: CyShop Talabat POS Integration Key (${keyId})\n\n` +
        `mQINBGN1SxgBEADOp1L3hQ9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1\n` +
        `nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK8vJ8\n` +
        `vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9\n` +
        `v8p1nB9pS4Bq7i8oJ1nK8vJ8vPq1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8oJ1nK\n` +
        `-----END PGP PUBLIC KEY BLOCK-----`;
      const dummyPrivate = 
        `-----BEGIN PGP PRIVATE KEY BLOCK-----\n` +
        `Version: GnuPG v2.4.5 (Wing32)\n` +
        `Key-ID: ${keyId}\n\n` +
        `MIIJqgIBAzNDBglghkgBZQMEAS4wEQQMk665Vb2e6vM20h8AAgEAMIICmgYJKoZI\n` +
        `hvcNAQcGoIICizCCAocCAQAwggKEBgkqhkiG9w0BBwEwHQYJYIZIAWUDBAEqBBDj\n` +
        `sD5B2/d84y8v6jD9e7eXgICChHq7x+K1z+K3D8x9vN9z1oK9v8p1nB9pS4Bq7i8o\n` +
        `-----END PGP PRIVATE KEY BLOCK-----`;
      setTalabatPublicKey(dummyPublic);
      setTalabatPrivateKey(dummyPrivate);
      triggerToast('GnuPG RSA-4096 Key Pair successfully generated and stored!', 'success');
    }, 2000);
  };

  const handlePingTest = (ipId, ipAddress) => {
    setPingStates(prev => ({ ...prev, [ipId]: 'pinging' }));
    setTimeout(() => {
      const isSuccess = Math.random() > 0.05;
      if (isSuccess) {
        const latency = Math.floor(15 + Math.random() * 45);
        setPingStates(prev => ({ ...prev, [ipId]: 'success' }));
        setPingLatencies(prev => ({ ...prev, [ipId]: latency }));
        triggerToast(`Ping to ${ipAddress} success: ${latency}ms`, 'success');
      } else {
        setPingStates(prev => ({ ...prev, [ipId]: 'failed' }));
        triggerToast(`Ping to ${ipAddress} timed out!`, 'error');
      }
    }, 1200);
  };

  const handleVerifyAws = () => {
    if (!awsAccessKeyId || !awsSecretAccessKey) {
      triggerToast('Please enter AWS Access Key ID and Secret Access Key', 'error');
      return;
    }
    setIsAwsVerifying(true);
    triggerToast('Performing AWS STS authentication & credential handshake...', 'info');
    setTimeout(() => {
      setIsAwsVerifying(false);
      setAwsConnected(true);
      triggerToast('AWS IAM validation succeeded! Connection established.', 'success');
      setAutonomousActions(old => [
        {
          id: 'aws-verify-' + Date.now() + '-' + Math.random(),
          type: 'compliance',
          label: `AWS Cloud Handshake - Region ${awsRegion} Verified`,
          status: 'completed',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...old
      ]);
    }, 1500);
  };

  const handleSyncPosToS3 = () => {
    if (!awsConnected) {
      triggerToast('AWS services offline. Verify credentials first.', 'error');
      return;
    }
    setIsAwsSyncing(true);
    setAwsSyncProgress({ label: 'Compiling Catalog & Transaction Invoices...', percent: 10 });
    
    setTimeout(() => {
      setAwsSyncProgress({ label: 'Serializing POS state metadata (JSON format)...', percent: 35 });
      setTimeout(() => {
        setAwsSyncProgress({ label: `Uploading catalog data to S3 bucket '${awsS3Bucket}'...`, percent: 60 });
        setTimeout(() => {
          setAwsSyncProgress({ label: `Synchronizing transaction records database to DynamoDB table '${awsDynamoTable}'...`, percent: 85 });
          setTimeout(() => {
            setIsAwsSyncing(false);
            setAwsSyncProgress(null);
            triggerToast('POS Catalog & transaction backup synced to AWS successfully!', 'success');
            setAutonomousActions(old => [
              {
                id: 'aws-sync-' + Date.now() + '-' + Math.random(),
                type: 'inventory',
                label: `POS Backup Package uploaded to S3 bucket: ${awsS3Bucket}`,
                status: 'completed',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              ...old
            ]);
            confetti({
              particleCount: 50,
              spread: 40,
              colors: ['#ed6c00', '#59c3e1']
            });
          }, 600);
        }, 800);
      }, 800);
    }, 800);
  };

  const handleCloudFrontInvalidation = () => {
    if (!awsConnected) {
      triggerToast('AWS connection required for invalidating CDN Cache.', 'error');
      return;
    }
    triggerToast('Creating CloudFront Cache Invalidation request for dist/* ...', 'info');
    setTimeout(() => {
      triggerToast('CloudFront CDN Cache cleared at edge nodes!', 'success');
      setAutonomousActions(old => [
        {
          id: 'aws-cf-' + Date.now() + '-' + Math.random(),
          type: 'po',
          label: 'AWS CloudFront CDN Cache Invalidation completed',
          status: 'completed',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...old
      ]);
    }, 1200);
  };

  const handleNovaQuery = (customText = '') => {
    const queryText = customText || novaQuery;
    if (!queryText.trim()) return;

    setNovaQuery('');
    setNovaSpeaking(false);
    setAvatarExpression('thinking');
    setNovaDialog('Decomposing query and consulting memory network...');
    triggerToast('Querying Nova reasoning engine...', 'info');

    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let response = '';

      if (lower.includes('sales') || lower.includes('sell') || lower.includes('amman') || lower.includes('yesterday')) {
        setAvatarExpression('pointing');
        setNovaSpeaking(true);
        response = "Amman Branch generated $52,300 yesterday, which is 12% higher than the previous day. Corporate sales in Riyadh hit 45,200 SAR. Visual metrics are projected on your dashboard.";
        setNovaDialog(response);
        setTimeout(() => {
          setActiveTab('dashboard');
          triggerToast('Nova redirected you to the Sales Dashboard', 'success');
        }, 3000);
      } else if (lower.includes('purchase') || lower.includes('coffee') || lower.includes('po')) {
        setAvatarExpression('talking');
        setNovaSpeaking(true);
        response = "Certainly. I am generating a draft Purchase Order for 50 bags of premium Cyber Espresso coffee beans on NovaERP. Initiating supplier verification...";
        setNovaDialog(response);
        
        setActionProgress({ label: 'Drafting Purchase Order', percent: 10 });
        const interval = setInterval(() => {
          setActionProgress(prev => {
            if (!prev) return null;
            if (prev.percent >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setActionProgress(null);
                setAutonomousActions(old => [
                  { id: 'po-' + Date.now() + '-' + Math.random(), type: 'po', label: 'Draft purchase order - 50 bags Coffee', status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                  ...old
                ]);
                triggerToast('Draft Purchase Order PO-2026-042 successfully generated on Odoo ERP!', 'success');
              }, 500);
              return { ...prev, percent: 100 };
            }
            return { ...prev, percent: prev.percent + 20 };
          });
        }, 400);
      } else if (lower.includes('leave') || lower.includes('faisal') || lower.includes('approve')) {
        setAvatarExpression('smiling');
        setNovaSpeaking(true);
        response = "Leave request processed. Approving annual leave request for Faisal Jameel in the HR portal from June 18 to June 25.";
        setNovaDialog(response);

        setActionProgress({ label: 'Approving Leave Request', percent: 10 });
        const interval = setInterval(() => {
          setActionProgress(prev => {
            if (!prev) return null;
            if (prev.percent >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setActionProgress(null);
                setAutonomousActions(old => [
                  { id: 'leave-' + Date.now() + '-' + Math.random(), type: 'leave', label: 'Approve annual leave - Faisal Jameel', status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                  ...old
                ]);
                triggerToast('Leave request approved and calendar synchronized!', 'success');
              }, 500);
              return { ...prev, percent: 100 };
            }
            return { ...prev, percent: prev.percent + 25 };
          });
        }, 300);
      } else if (lower.includes('burger') || lower.includes('promotion') || lower.includes('deal')) {
        setAvatarExpression('smiling');
        setNovaSpeaking(true);
        response = "Retrieving local promotions... Cyber Burger Joint is offering a 30% discount family meal for $9.50. I will automatically apply the coupon 'BURGER30' and place the order to your Jabal Amman address.";
        setNovaDialog(response);

        setActionProgress({ label: 'Autonomously Checkout Food Delivery Order', percent: 10 });
        const interval = setInterval(() => {
          setActionProgress(prev => {
            if (!prev) return null;
            if (prev.percent >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setActionProgress(null);
                
                const pizzaItem = products.find(p => p.id === 'p5') || products[4];
                const orderItems = [{ product: pizzaItem, quantity: 1, price: 9.50 }];
                const orderId = `ORD-${orders.length + 101}`;
                const invoiceId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
                const timestamp = new Date().toISOString();
                const newOrder = {
                  id: orderId,
                  items: orderItems,
                  total: 9.50,
                  status: 'pending',
                  timestamp,
                  invoiceId,
                  country: 'JO',
                  source: 'talabat',
                  deliveryInfo: {
                    riderName: 'Autonomous Nova Delivery Agent',
                    deliveryAddress: 'Jabal Amman, Home Office'
                  }
                };
                const subtotal = 9.50 / (1 + getTaxRate('JO'));
                const tax = 9.50 - subtotal;
                const newInvoice = {
                  id: invoiceId,
                  orderId,
                  timestamp,
                  items: [{ product: pizzaItem, quantity: 1, price: pizzaItem.price }],
                  subtotal: parseFloat(subtotal.toFixed(2)),
                  tax: parseFloat(tax.toFixed(2)),
                  total: 9.50,
                  country: 'JO',
                  source: 'talabat',
                  qrData: `CyShop Talabat JO | Inv: ${invoiceId} | VAT ID: 100239485 | Total: 9.50 JOD`
                };
                setOrders(prevOrders => [newOrder, ...prevOrders]);
                setInvoices(prev => [newInvoice, ...prev]);
                recordCheckoutJournalEntries('talabat', subtotal, tax, invoiceId, [{ product: pizzaItem, quantity: 1, price: pizzaItem.price }]);
                triggerToast('Talabat order checkout autonomously completed!', 'success');
                confetti({
                  particleCount: 100,
                  spread: 60,
                  colors: ['#ea580c', '#ffffff']
                });
              }, 500);
              return { ...prev, percent: 100 };
            }
            return { ...prev, percent: prev.percent + 15 };
          });
        }, 500);
      } else {
        setAvatarExpression('talking');
        setNovaSpeaking(true);
        response = `Understood. I have accessed Project Nova's semantic database for your query. Let me know if you would like to run BI sales audits, create purchase vouchers, or search for e-commerce promotions.`;
        setNovaDialog(response);
      }
    }, 1200);
  };

  // KDS kitchen steps progression
  const handleOrderKdsAction = (orderId, currentStatus) => {
    let nextStatus = 'pending';
    let label = '';

    if (currentStatus === 'unaccepted') {
      nextStatus = 'pending';
      label = 'accepted & queue initialized';
    } else if (currentStatus === 'pending') {
      nextStatus = 'cooking';
      label = 'cooking status';
    } else if (currentStatus === 'cooking') {
      nextStatus = 'ready';
      label = 'ready to serve';
    } else if (currentStatus === 'ready') {
      nextStatus = 'completed';
      label = 'completed and served';
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: nextStatus };
        }
        return order;
      })
    );

    triggerToast(`Order ${orderId} marked as ${label}`, 'success');
  };

  // Inventory Add Product Submit
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) {
      triggerToast('Please fill all product fields', 'error');
      return;
    }

    const priceNum = parseFloat(newProdPrice);
    const stockNum = parseInt(newProdStock);

    if (isNaN(priceNum) || priceNum <= 0 || isNaN(stockNum) || stockNum < 0) {
      triggerToast('Please enter valid numeric values', 'error');
      return;
    }

    const newId = `p${products.length + 1}`;
    const newProduct = {
      id: newId,
      name: newProdName,
      price: priceNum,
      category: newProdCategory,
      prepTime: '5 min',
      image: newProdImage
    };

    setProducts((prev) => [...prev, newProduct]);
    setInventory((prev) => [...prev, { product: newProduct, stock: stockNum, minStock: 20 }]);

    setNewProdName('');
    setNewProdImage('');
    setNewProdPrice('');
    setNewProdStock('50');

    triggerToast(`New product "${newProdName}" added successfully to catalog`, 'success');
  };

  // Add stock manually (+10 Qty)
  const restockItem = (prodId) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.product.id === prodId ? { ...item, stock: item.stock + 10 } : item
      )
    );
    const item = inventory.find((i) => i.product.id === prodId);
    triggerToast(`Added 10 units to stock for ${item?.product.name}`, 'success');
  };

  // CRM Customer Register
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      triggerToast('Please provide a name and phone number', 'error');
      return;
    }

    const pointsNum = parseInt(newCustPoints) || 0;
    const newCust = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: newCustName,
      phone: newCustPhone,
      points: pointsNum,
      tier: newCustTier
    };

    setCustomers((prev) => [...prev, newCust]);
    setSelectedCustomerId(newCust.id);

    setNewCustName('');
    setNewCustPhone('');
    setNewCustPoints('100');

    triggerToast(`Customer ${newCustName} registered!`, 'success');
  };

  // Generate reward loyalty points voucher code
  const handleGenerateVoucher = (customer) => {
    if (customer.points < 100) {
      triggerToast('Loyalty points must be at least 100 to redeem a voucher!', 'error');
      return;
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id ? { ...c, points: c.points - 100 } : c
      )
    );

    const voucherCode = `DISCOUNT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedVoucher(voucherCode);
    triggerToast(`100 loyalty points redeemed! Voucher ${voucherCode} generated.`, 'success');
  };

  // Shifts / HR Clock in / Clock out togglers
  const handleShiftToggle = (staffId) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const currentlyActive = s.activeShift;
          const time = currentlyActive ? '-' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          triggerToast(`${s.name} clocked ${currentlyActive ? 'out' : 'in'}`, 'success');
          return {
            ...s,
            activeShift: !currentlyActive,
            clockInTime: time
          };
        }
        return s;
      })
    );
  };

  // AI Assistant trigger responses
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatTyping(true);

    setTimeout(() => {
      const query = chatInput.toLowerCase();
      let responseText = '';

      if (query.includes('talabat') || query.includes('delivery')) {
        const talabatOrders = invoices.filter((i) => i.source === 'talabat');
        const revSA = talabatOrders.filter(i => i.country === 'SA').reduce((sum, i) => sum + i.total, 0);
        const revJO = talabatOrders.filter(i => i.country === 'JO').reduce((sum, i) => sum + i.total, 0);
        
        responseText = `Talabat integration audit:\n` +
          `• Connection Status: ${talabatConnected ? 'Online 🟢' : 'Offline 🔴'}\n` +
          `• Auto-Accept Tickets: ${talabatAutoAccept ? 'Active' : 'Manual Approval'}\n` +
          `• Merchant ID: ${talabatMerchantId}\n` +
          `• Total Orders Fulfilling: ${talabatOrders.length}\n` +
          `• Total Talabat Sales: ${revSA.toFixed(2)} SAR / ${revJO.toFixed(2)} JOD.\n` +
          `You can simulate incoming orders or adjust commission rates (${talabatCommission}%) in the Settings tab!`;
      } else if (query.includes('sales') || query.includes('revenue') || query.includes('report')) {
        const totalSA = invoices
          .filter((inv) => inv.country === 'SA')
          .reduce((sum, inv) => sum + inv.total, 0);
        const totalJO = invoices
          .filter((inv) => inv.country === 'JO')
          .reduce((sum, inv) => sum + inv.total, 0);
        responseText = `Current gross sales are: Saudi Arabia: ${totalSA.toFixed(2)} SAR, Jordan: ${totalJO.toFixed(2)} JOD. A total of ${invoices.length} e-invoices are logged.`;
      } else if (query.includes('inventory') || query.includes('stock') || query.includes('product')) {
        const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);
        if (lowStockItems.length > 0) {
          responseText = `Stock alert: There are ${lowStockItems.length} items with low stock level:\n` + 
            lowStockItems.map(i => `• ${i.product.name} (Qty: ${i.stock})`).join('\n') + 
            `\nYou can restock them directly in the Inventory tab!`;
        } else {
          responseText = `All products have healthy inventory levels (above min safety threshold of 20).`;
        }
      } else if (query.includes('customer') || query.includes('points') || query.includes('loyalty')) {
        responseText = `Registered loyalty program has ${customers.length} active customers. The highest ranking customer is ${
          customers.reduce((max, c) => (c.points > max.points ? c : max), customers[0]).name
        } with points rewards available.`;
      } else if (query.includes('kds') || query.includes('kitchen') || query.includes('queue')) {
        const pending = orders.filter((o) => o.status === 'pending').length;
        const cooking = orders.filter((o) => o.status === 'cooking').length;
        responseText = `Kitchen screen is currently displaying ${pending} pending tickets and ${cooking} active cooking boards.`;
      } else if (query.includes('compliance') || query.includes('zatca') || query.includes('tax')) {
        responseText = `CyShop compliance settings are active:\n• Saudi ZATCA e-Invoice Sandbox: ${zatcaSandbox ? 'Enabled' : 'Disabled'} (VAT: ${defaultVatSa}%)\n• Jordan ISTD e-Invoice: ${istdEnabled ? 'Active' : 'Disabled'} (VAT: ${defaultVatJo}%)\nAll printed receipts feature auto-generated validation QR codes.`;
      } else {
        responseText = `Understood. I have parsed your query. CyShop is operational in SA & JO. Let me know if you would like to audit shifts, check Talabat delivery streams, or restock inventory items.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setChatTyping(false);
      triggerToast('AI response generated', 'info');
    }, 1200);
  };

  // Filter products by active tab categories and top search
  const filteredProducts = products.filter((p) => {
    const matchCat = posCategory === 'All' || p.category === posCategory;
    const matchSearch =
      p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(globalSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="app-container">
      {/* Toast Overlay Alerts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${
              t.type === 'success'
                ? 'toast-success'
                : t.type === 'error'
                ? 'toast-error'
                : 'toast-info'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: 'var(--success-color)' }} />
            ) : t.type === 'error' ? (
              <AlertCircle size={18} style={{ color: 'var(--danger-color)' }} />
            ) : (
              <Info size={18} style={{ color: 'var(--info-color)' }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">C</div>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
              <span className="sidebar-logo-text">CYBERCOM</span>
              <span className="sidebar-tagline">CyShop ERP</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <LayoutDashboard size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'dashboard' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ShoppingBag size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'pos' ? 'var(--primary-color)' : 'var(--text-muted)' }}>POS Cashier</span>}
          </button>

          <button
            onClick={() => setActiveTab('kds')}
            className={`sidebar-item ${activeTab === 'kds' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ChefHat size={18} />
            {!sidebarCollapsed && (
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', color: activeTab === 'kds' ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                KDS Kitchen
                {orders.filter((o) => o.status !== 'completed').length > 0 && (
                  <span className="badge badge-warning" style={{ padding: '1px 6px', fontSize: '10px' }}>
                    {orders.filter((o) => o.status !== 'completed').length}
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Package size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'inventory' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Inventory</span>}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Users size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'customers' ? 'var(--primary-color)' : 'var(--text-muted)' }}>CRM Loyalty</span>}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`sidebar-item ${activeTab === 'invoices' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ReceiptText size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'invoices' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Invoices & VAT</span>}
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`sidebar-item ${activeTab === 'shifts' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Calendar size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'shifts' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Staff Shifts</span>}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <BarChart3 size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'analytics' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Analytics</span>}
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`sidebar-item ${activeTab === 'kiosk' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Store size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'kiosk' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Kiosk & QR Menu</span>}
          </button>

          <button
            onClick={() => setActiveTab('hr')}
            className={`sidebar-item ${activeTab === 'hr' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Users size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'hr' ? 'var(--primary-color)' : 'var(--text-muted)' }}>HR Management</span>}
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Calendar size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'attendance' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Attendance</span>}
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`sidebar-item ${activeTab === 'payroll' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ArrowUpRight size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'payroll' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Payroll</span>}
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`sidebar-item ${activeTab === 'accounting' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ReceiptText size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'accounting' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Accounting</span>}
          </button>

          <button
            onClick={() => setActiveTab('bom')}
            className={`sidebar-item ${activeTab === 'bom' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Package size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'bom' ? 'var(--primary-color)' : 'var(--text-muted)' }}>BOM & Kits</span>}
          </button>

          <button
            onClick={() => setActiveTab('supply')}
            className={`sidebar-item ${activeTab === 'supply' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <Bike size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'supply' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Supply Chain</span>}
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`sidebar-item ${activeTab === 'setup' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <ShieldCheck size={18} />
            {!sidebarCollapsed && (
              <span style={{ color: activeTab === 'setup' ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Setup Wizard
                <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>NEW</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('nova-avatar')}

            className={`sidebar-item ${activeTab === 'nova-avatar' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%', position: 'relative' }}
          >
            <Bot size={18} style={{ color: 'var(--ai-glow-color)' }} />
            {!sidebarCollapsed && (
              <span style={{ color: activeTab === 'nova-avatar' ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Nova Avatar
                <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 4px', background: 'var(--ai-glow-bg)', color: 'var(--ai-glow-color)', border: '1px solid var(--ai-glow-border)' }}>AGI</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
          >
            <SettingsIcon size={18} />
            {!sidebarCollapsed && <span style={{ color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-muted)' }}>Settings</span>}
          </button>
        </nav>

        {!sidebarCollapsed && (
          <div className="cybercom-status">
            <div className="cybercom-status-dot" />
            Systems Online
          </div>
        )}

        <div className="sidebar-footer" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">AD</div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">Admin Staff</span>
              <span className="user-role">Store Manager</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <h2 style={{ textTransform: 'capitalize', fontSize: '19px', fontWeight: '900', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {activeTab === 'pos' ? 'POS Cashier Screen' : activeTab === 'kds' ? 'Kitchen Monitor (KDS)' : activeTab === 'shifts' ? 'Staff Shifts' : activeTab === 'customers' ? 'CRM & Loyalty' : activeTab}
              </h2>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CYBERCOM ERP</span>
            </div>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Global search..."
                className="input"
                style={{ paddingLeft: '34px', height: '38px', color: 'var(--text-primary)' }}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            {/* Talabat Connection Status Indicator */}
            <div
              className="badge"
              style={{
                background: talabatConnected ? 'rgba(255, 96, 0, 0.1)' : 'var(--border-color)',
                color: talabatConnected ? '#ff6000' : 'var(--text-muted)',
                border: `1px solid ${talabatConnected ? 'rgba(255, 96, 0, 0.3)' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600'
              }}
              title="Talabat Integration Status"
            >
              <Bike size={13} />
              <span>Talabat: {talabatConnected ? 'Online' : 'Offline'}</span>
            </div>

            {/* Country flag switcher */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`flag-badge ${country === 'SA' ? 'flag-sa active' : ''}`}
                style={{
                  cursor: 'pointer',
                  opacity: country === 'SA' ? 1 : 0.45,
                  borderColor: country === 'SA' ? 'var(--primary-color)' : 'transparent',
                  background: country === 'SA' ? 'var(--primary-glow)' : '',
                  color: 'var(--text-primary)'
                }}
                onClick={() => handleCountryToggle('SA')}
              >
                🇸🇦 SA ({defaultVatSa}%)
              </button>
              <button
                className={`flag-badge ${country === 'JO' ? 'flag-jo active' : ''}`}
                style={{
                  cursor: 'pointer',
                  opacity: country === 'JO' ? 1 : 0.45,
                  borderColor: country === 'JO' ? 'var(--primary-color)' : 'transparent',
                  background: country === 'JO' ? 'var(--primary-glow)' : '',
                  color: 'var(--text-primary)'
                }}
                onClick={() => handleCountryToggle('JO')}
              >
                🇯🇴 JO ({defaultVatJo}%)
              </button>
            </div>

            {/* Dark Mode toggle */}
            <button className="btn btn-secondary btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode" style={{ color: 'var(--text-primary)' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="btn btn-secondary btn-icon" onClick={() => triggerToast('No unread notifications', 'info')} style={{ color: 'var(--text-primary)' }}>
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <main className="page-content">
            {/* KPI metrics */}
            <div className="kpi-grid">
              <div className="card kpi-card">
                <div className="kpi-header">
                  <span className="kpi-label">Saudi Sales (SAR)</span>
                  <span className="trend-up" style={{ color: 'var(--success-color)' }}><ArrowUpRight size={14} /> +12.4%</span>
                </div>
                <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
                  {invoices
                    .filter((i) => i.country === 'SA')
                    .reduce((acc, i) => acc + i.total, 0)
                    .toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-footer">
                  <span style={{ color: 'var(--text-muted)' }}>From {invoices.filter((i) => i.country === 'SA').length} e-invoices</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-header">
                  <span className="kpi-label">Jordan Sales (JOD)</span>
                  <span className="trend-up" style={{ color: 'var(--success-color)' }}><ArrowUpRight size={14} /> +8.2%</span>
                </div>
                <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
                  {invoices
                    .filter((i) => i.country === 'JO')
                    .reduce((acc, i) => acc + i.total, 0)
                    .toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-footer">
                  <span style={{ color: 'var(--text-muted)' }}>From {invoices.filter((i) => i.country === 'JO').length} e-invoices</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-header">
                  <span className="kpi-label">Active KDS Queue</span>
                  <span className="trend-down" style={{ color: 'var(--danger-color)' }}><ArrowDownRight size={14} /> -4.1%</span>
                </div>
                <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
                  {orders.filter((o) => o.status !== 'completed' && o.status !== 'unaccepted').length}
                </div>
                <div className="kpi-footer">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {orders.filter((o) => o.status === 'unaccepted').length} awaiting approval, {orders.filter((o) => o.status === 'pending').length} pending
                  </span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-header">
                  <span className="kpi-label">Kitchen Efficiency</span>
                  <span className="badge badge-ai"><Sparkles size={12} /> AI Assisted</span>
                </div>
                <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>94.8%</div>
                <div className="kpi-footer">
                  <span style={{ color: 'var(--text-muted)' }}>Average prep: 4.8 minutes</span>
                </div>
              </div>
            </div>

            {/* Split row: SVG line graph and Hot products */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>Hourly Sales Trend</h3>
                  <span className="badge badge-ai" style={{ fontSize: '11px' }}>Live Feed</span>
                </div>

                <svg className="chart-svg" viewBox="0 0 500 220">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="50" y1="30" x2="450" y2="30" className="chart-grid-line" />
                  <line x1="50" y1="80" x2="450" y2="80" className="chart-grid-line" />
                  <line x1="50" y1="130" x2="450" y2="130" className="chart-grid-line" />
                  <line x1="50" y1="180" x2="450" y2="180" className="chart-grid-line" />

                  <path d="M 50 180 Q 116 110 183 140 T 316 60 T 450 40 L 450 180 Z" className="chart-area" />
                  <path d="M 50 180 Q 116 110 183 140 T 316 60 T 450 40" className="chart-line" />

                  <circle cx="50" cy="180" r="4.5" className="chart-dot" onClick={() => triggerToast('08:00 AM sales active', 'info')} />
                  <circle cx="150" cy="125" r="4.5" className="chart-dot" onClick={() => triggerToast('10:00 AM sales active', 'info')} />
                  <circle cx="250" cy="90" r="4.5" className="chart-dot" onClick={() => triggerToast('12:00 PM peak sales', 'info')} />
                  <circle cx="350" cy="55" r="4.5" className="chart-dot" onClick={() => triggerToast('14:00 PM sales active', 'info')} />
                  <circle cx="450" cy="40" r="4.5" className="chart-dot" onClick={() => triggerToast('16:00 PM sales active', 'info')} />

                  <text x="45" y="195" className="chart-axis-text">08:00</text>
                  <text x="145" y="195" className="chart-axis-text">10:00</text>
                  <text x="245" y="195" className="chart-axis-text">12:00</text>
                  <text x="345" y="195" className="chart-axis-text">14:00</text>
                  <text x="430" y="195" className="chart-axis-text">16:00</text>

                  <text x="15" y="34" className="chart-axis-text">500</text>
                  <text x="15" y="84" className="chart-axis-text">250</text>
                  <text x="15" y="134" className="chart-axis-text">100</text>
                  <text x="25" y="184" className="chart-axis-text">0</text>
                </svg>
              </div>

              {/* Hot products shortcut panel */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>Best Sellers</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Click to quickly add to POS cart.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {products.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="product-item"
                        style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '8px 12px' }}
                        onClick={() => addToCart(p)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category}</span>
                        </div>
                        <span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '13px' }}>
                          {p.price.toFixed(2)} {getCurrency()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('pos')} style={{ width: '100%', marginTop: '12px' }}>
                  Open Cashier Drawer
                </button>
              </div>
            </div>

            {/* Recent Receipts Table */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="table-toolbar" style={{ borderBottom: 'none', padding: 0 }}>
                <span className="table-title" style={{ color: 'var(--text-primary)' }}>Recent Client Transactions</span>
                <button className="btn btn-secondary" onClick={() => setActiveTab('invoices')} style={{ color: 'var(--text-primary)' }}>
                  View All e-Invoices
                </button>
              </div>
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Order ID</th>
                      <th>Source Channel</th>
                      <th>Timestamp</th>
                      <th>VAT Value</th>
                      <th>Grand Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} onClick={() => { setSelectedInvoiceId(inv.id); setActiveTab('invoices'); }}>
                        <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{inv.id}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{inv.orderId}</td>
                        <td>
                          {inv.source === 'talabat' ? (
                            <span className="badge" style={{ background: 'rgba(255, 96, 0, 0.1)', color: '#ff6000', border: '1px solid rgba(255, 96, 0, 0.3)' }}>
                              Talabat Delivery
                            </span>
                          ) : (
                            <span className="badge badge-info">
                              Store Cashier
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ color: 'var(--text-primary)' }}>
                          {inv.tax.toFixed(2)} {getCurrency(inv.country)}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {inv.total.toFixed(2)} {getCurrency(inv.country)}
                        </td>
                        <td>
                          <span className="badge badge-success">
                            <Check size={10} /> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* POS Tab */}
        {activeTab === 'pos' && (
          <main className="page-content" style={{ padding: '20px 32px' }}>
            <div className="pos-layout">
              {/* POS catalog grid */}
              <div className="pos-catalog">
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['All', 'Coffee', 'Mains', 'Desserts', 'Drinks'].map((cat) => (
                    <button
                      key={cat}
                      className={`btn ${posCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 16px', borderRadius: '20px', color: posCategory === cat ? '#ffffff' : 'var(--text-primary)' }}
                      onClick={() => setPosCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="product-grid">
                  {filteredProducts.map((p) => {
                    const invItem = inventory.find((i) => i.product.id === p.id);
                    const isLow = invItem && invItem.stock <= invItem.minStock;
                    const isOut = invItem && invItem.stock <= 0;

                    return (
                      <div key={p.id} className="product-item" onClick={() => addToCart(p)} style={{ opacity: isOut ? 0.5 : 1 }}>
                        <div className="product-image-placeholder" style={{ overflow: 'hidden', padding: 0 }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '20px' }}>
                              {p.category === 'Coffee' && '☕'}
                              {p.category === 'Mains' && '🍔'}
                              {p.category === 'Desserts' && '🍰'}
                              {p.category === 'Drinks' && '🥤'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <span className="product-name" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stock: {invItem?.stock ?? 0}</span>
                            {isOut ? (
                              <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 4px' }}>Out of Stock</span>
                            ) : isLow ? (
                              <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>Low Stock</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="product-price">
                          <span style={{ color: 'var(--primary-color)' }}>
                            {p.price.toFixed(2)} {getCurrency()}
                          </span>
                          <span className="badge badge-ai" style={{ padding: '1px 5px', fontSize: '9px' }}>
                            +{getTaxRate() * 100}% VAT
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POS Cart sidebar */}
              <div className="pos-cart">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-primary)' }}>
                    <ShoppingBag size={18} /> Cashier Cart
                  </span>
                  {cart.length > 0 && (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => { setCart([]); triggerToast('Cart cleared', 'info'); }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cart.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '200px' }}>
                      <ShoppingBag size={48} style={{ strokeWidth: 1, marginBottom: '12px' }} />
                      <span style={{ fontSize: '13px' }}>Cashier cart is empty</span>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.product.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {(item.product.price * item.quantity).toFixed(2)} {getCurrency()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }}
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '16px', textAlign: 'center', color: 'var(--text-primary)' }}>
                            {item.quantity}
                          </span>
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }}
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ width: '28px', height: '28px', color: 'var(--danger-color)' }}
                            onClick={() => removeCartItem(item.product.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                        {cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)} {getCurrency()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>VAT ({getTaxRate() * 100}%)</span>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                        {(
                          cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * getTaxRate()
                        ).toFixed(2)}{' '}
                        {getCurrency()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', marginBottom: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                      <span style={{ color: 'var(--primary-color)' }}>
                        {(
                          cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * (1 + getTaxRate())
                        ).toFixed(2)}{' '}
                        {getCurrency()}
                      </span>
                    </div>

                    <button className="btn btn-primary" onClick={handleCheckout} style={{ width: '100%', padding: '12px 20px', fontSize: '15px', color: '#ffffff' }}>
                      Checkout Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* KDS Kitchen queue tab */}
        {activeTab === 'kds' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Fulfill walk-in registers and external Talabat streams.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="badge badge-warning">Awaiting Approval: {orders.filter(o => o.status === 'unaccepted').length}</span>
                <span className="badge badge-info font-mono">Cooking: {orders.filter(o => o.status === 'cooking').length}</span>
                <span className="badge badge-success font-mono">Ready: {orders.filter(o => o.status === 'ready').length}</span>
              </div>
            </div>

            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div className="card" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ChefHat size={64} style={{ margin: '0 auto 16px', strokeWidth: 1 }} />
                <h3 style={{ color: 'var(--text-primary)' }}>Kitchen Queue Empty</h3>
                <p style={{ marginTop: '8px' }}>All orders have been prepared and served.</p>
              </div>
            ) : (
              <div className="kds-grid">
                {orders
                  .filter((order) => order.status !== 'completed')
                  .map((order) => (
                    <div
                      key={order.id}
                      className={`card kds-card status-${order.status}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        borderTopWidth: '4px',
                        borderTopColor: order.status === 'unaccepted' ? '#ff6000' : ''
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {order.id}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* Channel Badge */}
                        {order.source === 'talabat' ? (
                          <span className="badge" style={{ background: 'rgba(255, 96, 0, 0.1)', color: '#ff6000', border: '1px solid rgba(255, 96, 0, 0.2)', padding: '2px 6px', fontSize: '10px' }}>
                            Talabat
                          </span>
                        ) : (
                          <span className="badge badge-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                            Walk-In
                          </span>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)' }}>
                              <span>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)', marginRight: '6px' }}>
                                  {item.quantity}x
                                </span>
                                {item.product.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Render delivery address details for Talabat orders */}
                      {order.source === 'talabat' && order.deliveryInfo && (
                        <div style={{ background: 'var(--bg-card-hover)', padding: '8px 12px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          <strong>Rider:</strong> {order.deliveryInfo.riderName} <br />
                          <strong>Address:</strong> {order.deliveryInfo.deliveryAddress}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        {order.status === 'unaccepted' && (
                          <button
                            className="btn"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', background: '#ff6000', color: '#ffffff' }}
                            onClick={() => handleOrderKdsAction(order.id, 'unaccepted')}
                          >
                            Accept Ticket
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', color: '#ffffff' }}
                            onClick={() => handleOrderKdsAction(order.id, 'pending')}
                          >
                            Start Cooking
                          </button>
                        )}
                        {order.status === 'cooking' && (
                          <button
                            className="btn btn-success"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', color: '#ffffff' }}
                            onClick={() => handleOrderKdsAction(order.id, 'cooking')}
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                            onClick={() => handleOrderKdsAction(order.id, 'ready')}
                          >
                            {order.source === 'talabat' ? 'Hand to Rider' : 'Deliver & Serve'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </main>
        )}

        {/* Inventory Module Tab */}
        {activeTab === 'inventory' && (
          <main className="page-content">
            <div className="split-pane">
              <div className="pane-main card" style={{ padding: 0 }}>
                <div className="table-toolbar">
                  <span className="table-title" style={{ color: 'var(--text-primary)' }}>Stock Status & Restocking</span>
                  <span className="badge badge-ai" style={{ fontSize: '11px' }}>
                    Low Safety Stock Threshold: 20
                  </span>
                </div>
                <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => {
                        const isLow = item.stock <= item.minStock;
                        const isOut = item.stock <= 0;

                        return (
                          <tr key={item.product.id}>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.product.name}</td>
                            <td style={{ color: 'var(--text-primary)' }}>{item.product.category}</td>
                            <td style={{ fontWeight: '700', color: isLow ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                              {item.stock} units
                            </td>
                            <td>
                              {isOut ? (
                                <span className="badge badge-danger">Out of Stock</span>
                              ) : isLow ? (
                                <span className="badge badge-warning">Low Stock</span>
                              ) : (
                                <span className="badge badge-success">OK</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-primary)' }}
                                onClick={() => restockItem(item.product.id)}
                              >
                                Restock (+10)
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pane-side card">
                <h3 className="card-title" style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
                  <PlusCircle size={16} style={{ color: 'var(--primary-color)' }} /> Add Catalog Product
                </h3>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="input"
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                      placeholder="e.g. Cyber Donut"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="select"
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                    >
                      <option value="Coffee">Coffee</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price ({getCurrency()})</label>
                    <input
                      type="text"
                      className="input"
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                      placeholder="e.g. 5.5"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock Level</label>
                    <input
                      type="number"
                      className="input"
                      style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                      placeholder="e.g. 50"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Catalog Image</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="product-image-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewProdImage(event.target.result);
                              triggerToast('Image uploaded successfully!', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ color: 'var(--text-primary)', height: '36px', fontSize: '12.5px', border: '1px solid var(--border-color)' }}
                        onClick={() => document.getElementById('product-image-upload').click()}
                      >
                        📂 Upload Image
                      </button>
                      {newProdImage ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                          <img src={newProdImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No image uploaded</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', alignSelf: 'center' }}>Presets:</span>
                      {[
                        { name: '☕ Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60' },
                        { name: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60' },
                        { name: '🍰 Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=60' },
                        { name: '🥤 Juice', url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?w=150&auto=format&fit=crop&q=60' }
                      ].map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          className="btn"
                          style={{ padding: '2px 6px', fontSize: '9.5px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-card-hover)' }}
                          onClick={() => {
                            setNewProdImage(img.url);
                            triggerToast(`Selected ${img.name.split(' ')[1]} preset!`, 'info');
                          }}
                        >
                          {img.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', color: '#ffffff' }}>
                    Register Product
                  </button>
                </form>
              </div>
            </div>
          </main>
        )}

        {/* CRM Customers Tab */}
        {activeTab === 'customers' && (
          <main className="page-content">
            <div className="split-pane">
              <div className="pane-main card" style={{ padding: 0 }}>
                <div className="table-toolbar">
                  <span className="table-title" style={{ color: 'var(--text-primary)' }}>Customer Loyalty Registry</span>
                </div>
                <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Points</th>
                        <th>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr
                          key={c.id}
                          className={c.id === selectedCustomerId ? 'active-row' : ''}
                          onClick={() => { setSelectedCustomerId(c.id); setGeneratedVoucher(null); }}
                        >
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.id}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</td>
                          <td style={{ color: 'var(--text-primary)' }}>{c.phone}</td>
                          <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{c.points} pts</td>
                          <td>
                            <span
                              className={`badge ${
                                c.tier === 'VIP'
                                  ? 'badge-ai'
                                  : c.tier === 'Gold'
                                  ? 'badge-warning'
                                  : 'badge-info'
                              }`}
                            >
                              {c.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pane-side" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(() => {
                  const customer = customers.find((c) => c.id === selectedCustomerId);
                  if (!customer) return <div className="card">Select a customer to view rewards.</div>;

                  return (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>Loyalty Rewards</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{customer.name}</strong>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Tier: {customer.tier}</span>
                        </div>
                        <span className="badge badge-ai" style={{ fontSize: '14px', padding: '4px 10px' }}>
                          {customer.points} pts
                        </span>
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', color: 'var(--text-primary)' }}
                        onClick={() => handleGenerateVoucher(customer)}
                      >
                        Redeem 100 Pts for Voucher
                      </button>

                      {generatedVoucher && (
                        <div
                          style={{
                            border: '2px dashed var(--ai-glow-border)',
                            background: 'var(--ai-glow-bg)',
                            padding: '12px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            marginTop: '10px'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--ai-glow-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            15% Discount Voucher
                          </span>
                          <strong style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'block', margin: '4px 0' }}>
                            {generatedVoucher}
                          </strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            Apply this code during next checkout checkout.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="card">
                  <h3 className="card-title" style={{ color: 'var(--text-primary)', marginBottom: '14px' }}>Register Customer</h3>
                  <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Layla Al-Amri"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. +966 55 555 5555"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Initial Points</label>
                        <input
                          type="number"
                          className="input"
                          value={newCustPoints}
                          onChange={(e) => setNewCustPoints(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tier</label>
                        <select
                          className="select"
                          value={newCustTier}
                          onChange={(e) => setNewCustTier(e.target.value)}
                        >
                          <option value="Regular">Regular</option>
                          <option value="Gold">Gold</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px', color: '#ffffff' }}>
                      Register Account
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <main className="page-content">
            <div className="split-pane">
              <div className="pane-main card" style={{ padding: 0 }}>
                <div className="table-toolbar">
                  <span className="table-title" style={{ color: 'var(--text-primary)' }}>Sales Receipts Log</span>
                </div>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Region</th>
                        <th>Subtotal</th>
                        <th>VAT Value</th>
                        <th>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className={inv.id === selectedInvoiceId ? 'active-row' : ''}
                          onClick={() => setSelectedInvoiceId(inv.id)}
                        >
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{inv.id}</td>
                          <td>
                            <span className={`flag-badge ${inv.country === 'SA' ? 'flag-sa' : 'flag-jo'}`} style={{ color: 'var(--text-primary)' }}>
                              {inv.country === 'SA' ? '🇸🇦 SA' : '🇯🇴 JO'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-primary)' }}>
                            {inv.subtotal.toFixed(2)} {getCurrency(inv.country)}
                          </td>
                          <td style={{ color: 'var(--text-primary)' }}>
                            {inv.tax.toFixed(2)} {getCurrency(inv.country)}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {inv.total.toFixed(2)} {getCurrency(inv.country)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Thermal paper receipt print simulator */}
              <div className="pane-side">
                {(() => {
                  const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
                  if (!invoice) return <div className="card">No invoice selected.</div>;

                  return (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>Thermal Print Preview</span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-primary)' }}
                          onClick={() => triggerToast(`Printing thermal invoice ${invoice.id}...`, 'info')}
                        >
                          Print Thermal
                        </button>
                      </div>

                      <div className="invoice-preview">
                        <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '1px dashed #d4d4d8', paddingBottom: '10px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#18181b' }}>{storeName}</h3>
                          <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0' }}>
                            {invoice.country === 'SA' ? 'Riyadh Retail Store Branch' : 'Amman Retail Store Branch'}
                          </p>
                          <p style={{ fontSize: '10px', color: '#71717a' }}>
                            VAT ID: {invoice.country === 'SA' ? '30045812900003' : '100239485'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', fontSize: '11px', color: '#18181b' }}>
                          <div>INVOICE: {invoice.id}</div>
                          <div>ORDER: {invoice.orderId}</div>
                          <div>DATE: {new Date(invoice.timestamp).toLocaleString()}</div>
                          <div>CHANNEL: {invoice.source === 'talabat' ? 'TALABAT DELIVERY' : 'STORE CASHIER'}</div>
                          {invoice.source === 'talabat' && <div>DISPATCHER: Talabat Courier</div>}
                          <div>STATUS: PAID</div>
                        </div>

                        <div style={{ borderTop: '1px dashed #d4d4d8', borderBottom: '1px dashed #d4d4d8', padding: '8px 0', margin: '8px 0', color: '#18181b' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '11px', marginBottom: '6px' }}>
                            <span>ITEM DESCRIPTION</span>
                            <span>QTY x PRICE</span>
                          </div>
                          {invoice.items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0' }}>
                              <span>{item.product.name}</span>
                              <span>
                                {item.quantity} x {item.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', alignItems: 'flex-end', marginBottom: '14px', color: '#18181b' }}>
                          <div>SUBTOTAL: {invoice.subtotal.toFixed(2)} {getCurrency(invoice.country)}</div>
                          <div>VAT ({invoice.country === 'SA' ? defaultVatSa : defaultVatJo}%): {invoice.tax.toFixed(2)} {getCurrency(invoice.country)}</div>
                          <div style={{ fontWeight: '800', borderTop: '1px solid #71717a', paddingTop: '4px', fontSize: '12px', color: '#18181b' }}>
                            GRAND TOTAL: {invoice.total.toFixed(2)} {getCurrency(invoice.country)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderTop: '1px dashed #d4d4d8', paddingTop: '12px' }}>
                          <div className="qr-code-box">
                            <div style={{ position: 'relative', width: '110px', height: '110px', border: '1px solid #e4e4e7', background: '#fafafa', display: 'flex', flexWrap: 'wrap' }}>
                              <div style={{ position: 'absolute', top: '4px', left: '4px', width: '24px', height: '24px', border: '5px solid #18181b' }}></div>
                              <div style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', border: '5px solid #18181b' }}></div>
                              <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '24px', height: '24px', border: '5px solid #18181b' }}></div>
                              <div style={{ width: '100%', height: '100%', opacity: 0.15, background: 'repeating-linear-gradient(45deg, #000, #000 4px, transparent 4px, transparent 12px)' }}></div>
                              
                              <div style={{ position: 'absolute', left: 0, width: '100%', height: '2px', backgroundColor: 'var(--success-color)', top: '10px', animation: 'cyberSlide 2.5s linear infinite' }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: '9px', color: '#71717a', textAlign: 'center' }}>
                            ZATCA / ISTD Verified QR Invoice
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </main>
        )}

        {/* Staff Shifts HR Tab */}
        {activeTab === 'shifts' && (
          <main className="page-content">
            <div className="card" style={{ padding: 0 }}>
              <div className="table-toolbar">
                <span className="table-title" style={{ color: 'var(--text-primary)' }}>HR Staff shift logs</span>
                <span className="badge badge-ai" style={{ fontSize: '11px' }}>
                  Total Staff: {staff.length}
                </span>
              </div>
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Shift Status</th>
                      <th>Clock-in Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.name}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{s.role}</td>
                        <td>
                          {s.activeShift ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-secondary" style={{ color: 'var(--text-muted)' }}>Off-duty</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.clockInTime}</td>
                        <td>
                          <button
                            className={`btn ${s.activeShift ? 'btn-danger' : 'btn-primary'}`}
                            style={{ padding: '6px 14px', fontSize: '12px', color: '#ffffff' }}
                            onClick={() => handleShiftToggle(s.id)}
                          >
                            {s.activeShift ? 'Clock Out' : 'Clock In'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <main className="page-content">
            {/* Sales Channel Share Progress Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="card">
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>Sales Channel Audit (SAR)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      <span>Walk-In Cashiers</span>
                      <span style={{ fontWeight: '700' }}>
                        {invoices
                          .filter((i) => i.country === 'SA' && i.source === 'walk-in')
                          .reduce((sum, i) => sum + i.total, 0)
                          .toFixed(2)}{' '}
                        SAR
                      </span>
                    </div>
                    <div className="sparkline-track">
                      <div
                        className="sparkline-fill"
                        style={{
                          width: `${
                            (invoices.filter((i) => i.country === 'SA' && i.source === 'walk-in').reduce((sum, i) => sum + i.total, 0) /
                              (invoices.filter((i) => i.country === 'SA').reduce((sum, i) => sum + i.total, 0) || 1)) *
                            100
                          }%`,
                          backgroundColor: 'var(--primary-color)'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      <span>Talabat Channel</span>
                      <span style={{ fontWeight: '700' }}>
                        {invoices
                          .filter((i) => i.country === 'SA' && i.source === 'talabat')
                          .reduce((sum, i) => sum + i.total, 0)
                          .toFixed(2)}{' '}
                        SAR
                      </span>
                    </div>
                    <div className="sparkline-track">
                      <div
                        className="sparkline-fill"
                        style={{
                          width: `${
                            (invoices.filter((i) => i.country === 'SA' && i.source === 'talabat').reduce((sum, i) => sum + i.total, 0) /
                              (invoices.filter((i) => i.country === 'SA').reduce((sum, i) => sum + i.total, 0) || 1)) *
                            100
                          }%`,
                          backgroundColor: '#ff6000'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>Sales Channel Audit (JOD)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      <span>Walk-In Cashiers</span>
                      <span style={{ fontWeight: '700' }}>
                        {invoices
                          .filter((i) => i.country === 'JO' && i.source === 'walk-in')
                          .reduce((sum, i) => sum + i.total, 0)
                          .toFixed(2)}{' '}
                        JOD
                      </span>
                    </div>
                    <div className="sparkline-track">
                      <div
                        className="sparkline-fill"
                        style={{
                          width: `${
                            (invoices.filter((i) => i.country === 'JO' && i.source === 'walk-in').reduce((sum, i) => sum + i.total, 0) /
                              (invoices.filter((i) => i.country === 'JO').reduce((sum, i) => sum + i.total, 0) || 1)) *
                            100
                          }%`,
                          backgroundColor: 'var(--primary-color)'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      <span>Talabat Channel</span>
                      <span style={{ fontWeight: '700' }}>
                        {invoices
                          .filter((i) => i.country === 'JO' && i.source === 'talabat')
                          .reduce((sum, i) => sum + i.total, 0)
                          .toFixed(2)}{' '}
                        JOD
                      </span>
                    </div>
                    <div className="sparkline-track">
                      <div
                        className="sparkline-fill"
                        style={{
                          width: `${
                            (invoices.filter((i) => i.country === 'JO' && i.source === 'talabat').reduce((sum, i) => sum + i.total, 0) /
                              (invoices.filter((i) => i.country === 'JO').reduce((sum, i) => sum + i.total, 0) || 1)) *
                            100
                          }%`,
                          backgroundColor: '#ff6000'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="card">
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>🇸🇦 Saudi Arabia Branch (SAR)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Revenue (Gross)</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices
                        .filter((i) => i.country === 'SA')
                        .reduce((sum, i) => sum + i.total, 0)
                        .toFixed(2)}{' '}
                      SAR
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total VAT Collected</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices
                        .filter((i) => i.country === 'SA')
                        .reduce((sum, i) => sum + i.tax, 0)
                        .toFixed(2)}{' '}
                      SAR
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Checkouts</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices.filter((i) => i.country === 'SA').length} sales
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>🇯🇴 Jordan Branch (JOD)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Revenue (Gross)</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices
                        .filter((i) => i.country === 'JO')
                        .reduce((sum, i) => sum + i.total, 0)
                        .toFixed(2)}{' '}
                      JOD
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total VAT Collected</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices
                        .filter((i) => i.country === 'JO')
                        .reduce((sum, i) => sum + i.tax, 0)
                        .toFixed(2)}{' '}
                      JOD
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Checkouts</span>
                    <span style={{ fontWeight: '700' }}>
                      {invoices.filter((i) => i.country === 'JO').length} sales
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    <span>Coffee & Espresso Bar</span>
                    <span style={{ fontWeight: '700' }}>42% of volume</span>
                  </div>
                  <div className="sparkline-track">
                    <div className="sparkline-fill" style={{ width: '42%', backgroundColor: 'var(--primary-color)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    <span>Mains & Platters</span>
                    <span style={{ fontWeight: '700' }}>31% of volume</span>
                  </div>
                  <div className="sparkline-track">
                    <div className="sparkline-fill" style={{ width: '31%', backgroundColor: 'var(--ai-glow-color)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    <span>Desserts & Treats</span>
                    <span style={{ fontWeight: '700' }}>18% of volume</span>
                  </div>
                  <div className="sparkline-track">
                    <div className="sparkline-fill" style={{ width: '18%', backgroundColor: 'var(--success-color)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    <span>Drinks & Juices</span>
                    <span style={{ fontWeight: '700' }}>9% of volume</span>
                  </div>
                  <div className="sparkline-track">
                    <div className="sparkline-fill" style={{ width: '9%', backgroundColor: 'var(--warning-color)' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <main className="page-content">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column: Config list */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--primary-color)', marginRight: '6px' }} /> System Configs & Compliance Settings
                </h3>

                {/* Talabat Integration settings */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h4 style={{ color: '#ff6000', marginBottom: '12px', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bike size={16} /> Talabat Integration Panel
                  </h4>

                  {/* Nested sub-tabs for Talabat Integration */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTalabatSubTab('general')}
                      className={`btn ${activeTalabatSubTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', color: activeTalabatSubTab === 'general' ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTalabatSubTab('metadata')}
                      className={`btn ${activeTalabatSubTab === 'metadata' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', color: activeTalabatSubTab === 'metadata' ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      API Metadata
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTalabatSubTab('credentials')}
                      className={`btn ${activeTalabatSubTab === 'credentials' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', color: activeTalabatSubTab === 'credentials' ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      OAuth2 Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTalabatSubTab('pgp')}
                      className={`btn ${activeTalabatSubTab === 'pgp' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', color: activeTalabatSubTab === 'pgp' ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      GnuPG / PGP Keys
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTalabatSubTab('whitelist')}
                      className={`btn ${activeTalabatSubTab === 'whitelist' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', color: activeTalabatSubTab === 'whitelist' ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      IP Whitelist
                    </button>
                  </div>

                  {/* Sub-tab Content Panels */}
                  <div style={{ minHeight: '220px' }}>
                    {activeTalabatSubTab === 'general' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group">
                            <label className="form-label">Talabat Merchant ID</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatMerchantId}
                              onChange={(e) => setTalabatMerchantId(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Talabat Commission Rate (%)</label>
                            <input
                              type="number"
                              className="input"
                              value={talabatCommission}
                              onChange={(e) => setTalabatCommission(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={talabatConnected}
                              onChange={(e) => {
                                setTalabatConnected(e.target.checked);
                                triggerToast(`Talabat store connection set to ${e.target.checked ? 'Online' : 'Offline'}`, 'info');
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Enable Talabat Store Channel (Online Receiver)
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={talabatAutoAccept}
                              onChange={(e) => setTalabatAutoAccept(e.target.checked)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Auto-Accept Incoming Delivery Tickets (Instantly Route to KDS)
                          </label>
                        </div>

                        <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Test the Talabat integration workflow by generating a mock delivery ticket.
                          </span>
                          <button
                            type="button"
                            className="btn"
                            style={{ background: '#ff6000', color: '#ffffff', fontWeight: '700' }}
                            onClick={handleSimulateTalabatOrder}
                          >
                            Simulate Incoming Talabat Order
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTalabatSubTab === 'metadata' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Integration Name</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatIntegrationName}
                              onChange={(e) => setTalabatIntegrationName(e.target.value)}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Convention: Company + Country</span>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Integration Code</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatIntegrationCode}
                              onChange={(e) => setTalabatIntegrationCode(e.target.value)}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Convention: company-name-countrycode</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Webhook Base URL</label>
                          <input
                            type="text"
                            className="input"
                            value={talabatBaseUrl}
                            onChange={(e) => setTalabatBaseUrl(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Plugin Username</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatPluginUsername}
                              onChange={(e) => setTalabatPluginUsername(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Vendor Remote ID</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatRemoteId}
                              onChange={(e) => setTalabatRemoteId(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Chain Name</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatChainName}
                              onChange={(e) => setTalabatChainName(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Chain Code</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatChainCode}
                              onChange={(e) => setTalabatChainCode(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTalabatSubTab === 'credentials' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">OAuth2 Client ID</label>
                            <input
                              type="text"
                              className="input"
                              value={talabatClientId}
                              onChange={(e) => setTalabatClientId(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">OAuth2 Client Secret</label>
                            <input
                              type="password"
                              className="input"
                              value={talabatClientSecret}
                              onChange={(e) => setTalabatClientSecret(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Bearer Token</label>
                          <textarea
                            className="input"
                            style={{ height: '60px', fontSize: '11px', fontFamily: 'var(--font-mono)', resize: 'none' }}
                            value={talabatAccessToken}
                            onChange={(e) => setTalabatAccessToken(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Token Status: {talabatTokenStatus}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>POST /v2/login (client_credentials)</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ height: '32px', padding: '0 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}
                            onClick={handleRequestToken}
                            disabled={requestingToken}
                          >
                            {requestingToken ? 'Fetching...' : 'Fetch Token'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTalabatSubTab === 'pgp' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-card-hover)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                            GnuPG Onboarding Key Configuration
                          </span>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            Onboarding requires sharing a PGP public key. Download the tool below:
                          </span>
                          <a 
                            href="https://gnupg.org/download/index.html" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            GnuPG Official Download Portal <ArrowUpRight size={12} />
                          </a>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-primary)' }}>
                          <span style={{ display: 'block', color: 'var(--warning-color)', fontWeight: '600', marginBottom: '2px' }}># CLI Generation Commands:</span>
                          gpg --full-generate-key<br/>
                          gpg --armor --export {talabatPluginUsername}@cyshop.com &gt; cyshop_public_key.asc
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Public PGP Key Block</label>
                            <textarea
                              className="input"
                              style={{ height: '90px', fontSize: '9px', fontFamily: 'var(--font-mono)', resize: 'none' }}
                              value={talabatPublicKey}
                              onChange={(e) => setTalabatPublicKey(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Private PGP Key Block</label>
                            <textarea
                              className="input"
                              style={{ height: '90px', fontSize: '9px', fontFamily: 'var(--font-mono)', resize: 'none' }}
                              value={talabatPrivateKey}
                              onChange={(e) => setTalabatPrivateKey(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ width: '100%', fontWeight: '600', color: 'var(--text-primary)' }}
                          onClick={handleRegeneratePgpKeys}
                          disabled={regeneratingPgp}
                        >
                          {regeneratingPgp ? 'Generating Keypair...' : 'Regenerate GnuPG RSA-4096 Keypair'}
                        </button>
                      </div>
                    )}

                    {activeTalabatSubTab === 'whitelist' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-card-hover)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Whitelist the following IP addresses to receive incoming order webhooks from Integration Middleware:
                        </div>

                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: 0 }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Zone</th>
                                <th style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>IP Address</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { id: 'me-1', region: 'Middle East', ip: '63.32.225.161' },
                                { id: 'me-2', region: 'Middle East', ip: '18.202.96.85' },
                                { id: 'me-3', region: 'Middle East', ip: '52.208.41.152' },
                                { id: 'stg-1', region: 'Staging', ip: '34.246.34.27' },
                                { id: 'stg-2', region: 'Staging', ip: '18.202.142.208' },
                                { id: 'stg-3', region: 'Staging', ip: '54.72.10.41' }
                              ].map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '6px 10px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.region}</td>
                                  <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{item.ip}</td>
                                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                      {pingStates[item.id] === 'success' && (
                                        <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 4px', fontWeight: '700' }}>
                                          {pingLatencies[item.id]}ms
                                        </span>
                                      )}
                                      {pingStates[item.id] === 'failed' && (
                                        <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 4px', fontWeight: '700' }}>
                                          Timeout
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        className="btn"
                                        style={{ height: '20px', padding: '0 8px', fontSize: '9.5px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'transparent' }}
                                        onClick={() => handlePingTest(item.id, item.ip)}
                                        disabled={pingStates[item.id] === 'pinging'}
                                      >
                                        {pingStates[item.id] === 'pinging' ? 'Pinging...' : 'Ping'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Careem Integration settings */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h4 style={{ color: '#00c010', marginBottom: '12px', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bike size={16} style={{ color: '#00c010' }} /> Careem Integration Panel
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={careemEnabled}
                        onChange={(e) => setCareemEnabled(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      Enable Careem Delivery Store Channel
                    </label>

                    {careemEnabled && (
                      <div style={{
                        marginTop: '12px',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card-hover)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#00c010', display: 'block' }}>
                          🟢 Careem API Credentials
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Merchant ID</label>
                            <input
                              type="text"
                              className="input"
                              style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                              placeholder="e.g. CRM-CyShop-AMM"
                              value={careemMerchantId}
                              onChange={(e) => setCareemMerchantId(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Vendor Code</label>
                            <input
                              type="text"
                              className="input"
                              style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                              placeholder="e.g. CRM-VND-02"
                              value={careemVendorCode}
                              onChange={(e) => setCareemVendorCode(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Careem API Endpoint Base</label>
                          <input
                            type="text"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="https://api.careem.com/v1/pos"
                            value={careemBaseUrl}
                            onChange={(e) => setCareemBaseUrl(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Careem Authorization Key</label>
                          <input
                            type="password"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="Enter Careem API Key"
                            value={careemApiKey}
                            onChange={(e) => setCareemApiKey(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            onClick={() => {
                              if (!careemMerchantId || !careemApiKey) {
                                triggerToast('Please enter Careem Merchant credentials first', 'error');
                                return;
                              }
                              triggerToast('Testing Careem POS endpoint connection...', 'info');
                              setTimeout(() => {
                                setCareemConnected(true);
                                triggerToast('Careem API connection established successfully!', 'success');
                              }, 1500);
                            }}
                          >
                            Verify Careem Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14.5px' }}>Store Branding Settings</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Store Brand Name</label>
                      <input
                        type="text"
                        className="input"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Help Hotline</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="+966 11 000 0000"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14.5px' }}>Saudi ZATCA E-Invoicing Compliance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={zatcaSandbox}
                        onChange={(e) => setZatcaSandbox(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      Enable ZATCA Phase-2 Developer Sandbox Compliance Mode
                    </label>
                    
                    <div className="form-group" style={{ width: '220px', marginTop: '6px' }}>
                      <label className="form-label">Saudi VAT Rate (%)</label>
                      <input
                        type="number"
                        className="input"
                        value={defaultVatSa}
                        onChange={(e) => setDefaultVatSa(e.target.value)}
                      />
                    </div>

                    {zatcaSandbox && (
                      <div style={{
                        marginTop: '12px',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card-hover)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--primary-color)', display: 'block' }}>
                          🇸🇦 ZATCA Cryptographic Connection
                        </span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>ZATCA Client ID</label>
                            <input
                              type="text"
                              className="input"
                              style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                              placeholder="e.g. ZATCA-CL-88291"
                              value={zatcaClientId}
                              onChange={(e) => setZatcaClientId(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Stamp Mode</label>
                            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', marginTop: '8px' }}>Sandbox-V2</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Cryptographic Stamp (CSID)</label>
                          <input
                            type="text"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="e.g. CSID-2026-98124"
                            value={zatcaCsid}
                            onChange={(e) => setZatcaCsid(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>API Secret Key</label>
                          <input
                            type="password"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="Enter ZATCA Secret Key"
                            value={zatcaSecret}
                            onChange={(e) => setZatcaSecret(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            onClick={() => {
                              if (!zatcaClientId || !zatcaSecret) {
                                triggerToast('Please enter ZATCA Client credentials first', 'error');
                                return;
                              }
                              triggerToast('Verifying signature certificate with ZATCA developer portal...', 'info');
                              setTimeout(() => {
                                setZatcaConnected(true);
                                triggerToast('ZATCA Cryptographic Stamp & CSID verified successfully!', 'success');
                              }, 1500);
                            }}
                          >
                            Verify ZATCA Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14.5px' }}>Jordan ISTD E-Invoicing Compliance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={istdEnabled}
                        onChange={(e) => setIstdEnabled(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      Enable Jordan ISTD Digital Invoicing Integration
                    </label>
                    <div className="form-group" style={{ width: '220px', marginTop: '6px' }}>
                      <label className="form-label">Jordan VAT Rate (%)</label>
                      <input
                        type="number"
                        className="input"
                        value={defaultVatJo}
                        onChange={(e) => setDefaultVatJo(e.target.value)}
                      />
                    </div>

                    {istdEnabled && (
                      <div style={{
                        marginTop: '12px',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card-hover)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--primary-color)', display: 'block' }}>
                          🇯🇴 Jofotara Connection Credentials
                        </span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>EGS Device Username</label>
                            <input
                              type="text"
                              className="input"
                              style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                              placeholder="e.g. EGS-JO-59821"
                              value={jofotaraUsername}
                              onChange={(e) => setJofotaraUsername(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>Seq Number</label>
                            <input
                              type="text"
                              className="input"
                              style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                              placeholder="e.g. 1"
                              value={jofotaraSeqNumber}
                              onChange={(e) => setJofotaraSeqNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>EGS Secret Key</label>
                          <input
                            type="password"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="Enter Secret Key"
                            value={jofotaraSecret}
                            onChange={(e) => setJofotaraSecret(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: 'var(--text-muted)' }}>Gateway Endpoint</label>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-primary)' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="jofotara_ep"
                                  checked={jofotaraEndpoint === 'sandbox'}
                                  onChange={() => setJofotaraEndpoint('sandbox')}
                                  style={{ cursor: 'pointer' }}
                                />
                                Sandbox
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="jofotara_ep"
                                  checked={jofotaraEndpoint === 'production'}
                                  onChange={() => setJofotaraEndpoint('production')}
                                  style={{ cursor: 'pointer' }}
                                />
                                Prod
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            onClick={() => {
                              if (!jofotaraUsername || !jofotaraSecret) {
                                triggerToast('Please enter EGS credentials first', 'error');
                                return;
                              }
                              triggerToast('Connecting & Handshaking with Jofotara API Gateway...', 'info');
                              setTimeout(() => {
                                setJofotaraConnected(true);
                                triggerToast('Jofotara connection established and authenticated successfully!', 'success');
                              }, 1500);
                            }}
                          >
                            Verify Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <h4 style={{ color: '#ed6c00', marginBottom: '12px', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ed6c00' }}>
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                    </svg>
                    AWS Cloud Services & Deployment Config
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={awsAutoSync}
                          onChange={(e) => setAwsAutoSync(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        Auto-Sync POS Checkouts (DynamoDB)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={awsStaticHosting}
                          onChange={(e) => setAwsStaticHosting(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        S3 Static Website Hosting (CDN)
                      </label>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card-hover)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#ed6c00', display: 'block' }}>
                        ☁️ AWS IAM & Services Credentials
                      </span>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>AWS Access Key ID</label>
                          <input
                            type="text"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)', fontFamily: 'var(--font-mono)' }}
                            placeholder="AKIA..."
                            value={awsAccessKeyId}
                            onChange={(e) => setAwsAccessKeyId(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>AWS Default Region</label>
                          <select
                            className="select"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            value={awsRegion}
                            onChange={(e) => setAwsRegion(e.target.value)}
                          >
                            <option value="us-east-1">us-east-1 (N. Virginia)</option>
                            <option value="us-west-2">us-west-2 (Oregon)</option>
                            <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                            <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                            <option value="me-central-1">me-central-1 (UAE)</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>AWS Secret Access Key</label>
                        <input
                          type="password"
                          className="input"
                          style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)', fontFamily: 'var(--font-mono)' }}
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          value={awsSecretAccessKey}
                          onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>S3 Backup Bucket</label>
                          <input
                            type="text"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="cyshop-pos-backups"
                            value={awsS3Bucket}
                            onChange={(e) => setAwsS3Bucket(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: '600' }}>DynamoDB Table</label>
                          <input
                            type="text"
                            className="input"
                            style={{ fontSize: '12.5px', height: '36px', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                            placeholder="cyshop-transactions-prod"
                            value={awsDynamoTable}
                            onChange={(e) => setAwsDynamoTable(e.target.value)}
                          />
                        </div>
                      </div>

                      {isAwsSyncing && awsSyncProgress && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            <span>{awsSyncProgress.label}</span>
                            <span style={{ fontWeight: '700' }}>{awsSyncProgress.percent}%</span>
                          </div>
                          <div className="sparkline-track" style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px' }}>
                            <div className="sparkline-fill" style={{ width: `${awsSyncProgress.percent}%`, backgroundColor: '#ed6c00', height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px', flexWrap: 'wrap' }}>
                        {awsStaticHosting && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            onClick={handleCloudFrontInvalidation}
                            disabled={!awsConnected}
                          >
                            Clear CDN Cache
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                          onClick={handleSyncPosToS3}
                          disabled={!awsConnected || isAwsSyncing}
                        >
                          {isAwsSyncing ? 'Syncing...' : 'Push POS Backup'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ height: '32px', fontSize: '11px', padding: '0 12px', color: '#ffffff', borderRadius: '6px' }}
                          onClick={handleVerifyAws}
                          disabled={isAwsVerifying}
                        >
                          {isAwsVerifying ? 'Verifying...' : 'Verify AWS Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Connection testing */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>
                  <Building size={16} style={{ color: 'var(--primary-color)' }} /> ERP Network Integration
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Test connection with delivery partners and tax authority servers.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Talabat Integration Node:</span>
                    <span className={`badge ${talabatConnected ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                      {talabatConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Careem Integration Node:</span>
                    <span className={`badge ${careemEnabled && careemConnected && careemMerchantId && careemApiKey ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                      {careemEnabled && careemConnected && careemMerchantId && careemApiKey ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ZATCA API Gateway:</span>
                    <span className={`badge ${zatcaConnected && zatcaClientId && zatcaSecret ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                      {zatcaConnected && zatcaClientId && zatcaSecret ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Jordan ISTD Gateway:</span>
                    <span className={`badge ${istdEnabled && jofotaraConnected && jofotaraUsername && jofotaraSecret ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                      {istdEnabled && jofotaraConnected && jofotaraUsername && jofotaraSecret ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>AWS Cloud Services:</span>
                    <span className={`badge ${awsConnected && awsAccessKeyId && awsSecretAccessKey ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                      {awsConnected && awsAccessKeyId && awsSecretAccessKey ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Local Printer Spooler:</span>
                    <span className="badge badge-warning" style={{ padding: '1px 6px', fontSize: '10px' }}>Idle</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px', color: '#ffffff' }}
                  onClick={() => {
                    triggerToast('Verifying connection pathways...', 'info');
                    setTimeout(() => {
                      let errors = [];
                      if (istdEnabled && (!jofotaraUsername || !jofotaraSecret)) errors.push('Jofotara');
                      if (zatcaSandbox && (!zatcaClientId || !zatcaSecret)) errors.push('ZATCA');
                      if (careemEnabled && (!careemMerchantId || !careemApiKey)) errors.push('Careem');
                      if (!awsAccessKeyId || !awsSecretAccessKey) errors.push('AWS Cloud');
                      
                      if (errors.length > 0) {
                        if (istdEnabled && (!jofotaraUsername || !jofotaraSecret)) setJofotaraConnected(false);
                        if (zatcaSandbox && (!zatcaClientId || !zatcaSecret)) setZatcaConnected(false);
                        if (careemEnabled && (!careemMerchantId || !careemApiKey)) setCareemConnected(false);
                        if (!awsAccessKeyId || !awsSecretAccessKey) setAwsConnected(false);
                        triggerToast(`Verification failed: Config missing for ${errors.join(', ')}`, 'error');
                      } else {
                        setJofotaraConnected(true);
                        setZatcaConnected(true);
                        setCareemConnected(true);
                        setAwsConnected(true);
                        triggerToast('All compliance pipelines, delivery channels, and AWS services verified successfully!', 'success');
                      }
                    }, 1200);
                  }}
                >
                  Verify compliance & channels
                </button>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoPrint}
                      onChange={(e) => setAutoPrint(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Enable Auto-Print on Checkout
                  </label>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Project Nova Avatar Tab View */}
        {activeTab === 'nova-avatar' && (
          <main className="page-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
              {/* Left Column: Interactive 3D Avatar Display & Controls */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="card-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} style={{ color: 'var(--ai-glow-color)' }} />
                  Interactive Nova AI Human
                </h3>

                {/* The Interactive Canvas Render */}
                <NovaAvatarCanvas avatar={selectedAvatar} expression={avatarExpression} speaking={novaSpeaking} />

                {/* Dialog Output bubble */}
                <div style={{ background: 'var(--bg-card-hover)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-8px', left: '24px', width: '0', height: '0', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid var(--border-color)' }} />
                  <p style={{ fontSize: '13.5px', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0, fontWeight: '500' }}>
                    {novaDialog}
                  </p>
                </div>

                {/* Action progress bar if active */}
                {actionProgress && (
                  <div style={{ background: 'var(--ai-glow-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ai-glow-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: 'var(--ai-glow-color)', marginBottom: '6px' }}>
                      <span>{actionProgress.label}...</span>
                      <span>{actionProgress.percent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${actionProgress.percent}%`, height: '100%', background: 'var(--ai-glow-color)', transition: 'width 0.1s ease' }} />
                    </div>
                  </div>
                )}

                {/* Voice & Mic Control Button Group */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ffffff', background: novaSpeaking ? 'var(--danger-color)' : 'var(--primary-color)' }}
                    onClick={() => {
                      if (novaSpeaking) {
                        setNovaSpeaking(false);
                      } else {
                        setNovaSpeaking(true);
                        setAvatarExpression('talking');
                        triggerToast('Nova speaking loop started', 'info');
                      }
                    }}
                  >
                    <Bot size={18} />
                    {novaSpeaking ? 'Stop Avatar Voice' : 'Simulate Audio Out'}
                  </button>

                  <button
                    className={`btn ${novaVoiceActive ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: novaVoiceActive ? '#ffffff' : 'var(--text-primary)' }}
                    onClick={() => {
                      const newVoiceState = !novaVoiceActive;
                      setNovaVoiceActive(newVoiceState);
                      if (newVoiceState) {
                        triggerToast('Microphone channel open... Listening for wake word "Nova"', 'info');
                      } else {
                        triggerToast('Microphone channel closed', 'info');
                      }
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Identity Presets Selector Library */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '10px', fontWeight: '700' }}>Choose Avatar Digital Employee Identity</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'executive', name: 'Faisal', role: 'ERP Exec', icon: '👔' },
                      { id: 'doctor', name: 'Sarah', role: 'Medical', icon: '🩺' },
                      { id: 'chef', name: 'Tareq', role: 'Head Chef', icon: '👨‍🍳' },
                      { id: 'manager', name: 'Yasmeen', role: 'Ops Mgr', icon: '🎧' },
                      { id: 'core', name: 'Nova Core', role: 'AGI Node', icon: '🌌' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedAvatar(item.id);
                          triggerToast(`Switched employee persona to ${item.name}`, 'success');
                          if (item.id === 'core') {
                            setNovaDialog('AGI Node online. Multi-agent core ready. Standing by for database schema operations.');
                          } else {
                            setNovaDialog(`Hello, I am ${item.name}, your specialized ${item.role} assistant. How can I help you run operations today?`);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: selectedAvatar === item.id ? '2px solid var(--ai-glow-color)' : '1px solid var(--border-color)',
                          background: selectedAvatar === item.id ? 'var(--ai-glow-bg)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{item.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interaction Interfaces (Tabs) */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Horizontal tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '12px', paddingBottom: '4px', overflowX: 'auto' }}>
                  {[
                    { id: 'erp', name: 'ERP Console', icon: <Building size={14} /> },
                    { id: 'delivery', name: 'Food Assistant', icon: <Bike size={14} /> },
                    { id: 'benchmark', name: 'Competitive Matrix', icon: <ShieldCheck size={14} /> },
                    { id: 'blueprints', name: 'Arch Blueprints', icon: <LayoutDashboard size={14} /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveNovaSubTab(tab.id)}
                      className={`btn ${activeNovaSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: activeNovaSubTab === tab.id ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      {tab.icon}
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Content */}
                <div style={{ flex: 1, minHeight: '360px' }}>
                  {/* ERP CONSOLE & BI */}
                  {activeNovaSubTab === 'erp' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                        Ask questions about sales metrics, HR directories, or execute automated workflow actions:
                      </p>

                      {/* Dynamic Input trigger */}
                      <div className="form-group">
                        <label className="form-label">Voice / Text Command Prompt</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="input"
                            placeholder='e.g., "Nova, create purchase order for 50 bags of coffee"'
                            value={novaQuery}
                            onChange={(e) => setNovaQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleNovaQuery(); }}
                          />
                          <button className="btn btn-primary" style={{ color: '#ffffff' }} onClick={() => handleNovaQuery()}>Run</button>
                        </div>
                      </div>

                      {/* Quick Command Suggestions */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>SUGGESTED ERP & BI PHRASES:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
                            onClick={() => handleNovaQuery("Nova, how much did Amman Branch sell yesterday?")}
                          >
                            📊 Yesterday's Sales
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
                            onClick={() => handleNovaQuery("Create purchase order for 50 coffee bags")}
                          >
                            🛒 Create Purchase Order (PO)
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
                            onClick={() => handleNovaQuery("Approve annual leave request for Faisal")}
                          >
                            ✍️ Approve Faisal Leave Request
                          </button>
                        </div>
                      </div>

                      {/* Autonomous Action History Log */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Autonomous Task Execution Log</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {autonomousActions.map((act) => (
                            <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{act.label}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 6px' }}>Completed</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{act.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FOOD & DELIVERY ASSISTANT */}
                  {activeNovaSubTab === 'delivery' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                        Search regional food deals, compile orders, and authorize checkout actions using Talabat integration protocols:
                      </p>

                      <div className="form-group">
                        <label className="form-label">Search Food / Promotions</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="input"
                            value={deliveryQuery}
                            onChange={(e) => setDeliveryQuery(e.target.value)}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ color: '#ffffff' }}
                            onClick={() => {
                              triggerToast('Searching nearby branches...', 'info');
                            }}
                          >
                            Search
                          </button>
                        </div>
                      </div>

                      {/* Promotions Grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {deliveryResults.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '24px' }}>{item.logo}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--warning-color)', fontWeight: '600' }}>{item.promo}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Est. Distance: {item.distance}</span>
                              </div>
                            </div>
                            <button
                              className="btn btn-secondary"
                              style={{ height: '32px', padding: '0 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}
                              onClick={() => {
                                handleNovaQuery(`Find burger deal under $10 at ${item.name} and order it`);
                              }}
                            >
                              Order (${item.price.toFixed(2)})
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick voice command simulation */}
                      <div style={{ background: 'var(--ai-glow-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ai-glow-border)' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ai-glow-color)', marginBottom: '4px' }}>VOICE COMAND SHORTCUT:</span>
                        <button
                          className="btn"
                          style={{ width: '100%', background: 'var(--ai-glow-color)', color: '#ffffff', fontWeight: '700', fontSize: '12px' }}
                          onClick={() => handleNovaQuery("Find me the best burger deal under $10")}
                        >
                          "Find me the best burger deal under $10 and order it"
                        </button>
                      </div>
                    </div>
                  )}

                  {/* COMPETITOR BENCHMARKING */}
                  {activeNovaSubTab === 'benchmark' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        Gaps & Advantage Audit Matrix comparing Project Nova against leading industry platforms:
                      </p>

                      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: 0 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                              <th style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>Feature Dimension</th>
                              <th style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>Project Nova</th>
                              <th style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>OpenAI Operator</th>
                              <th style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>NVIDIA ACE</th>
                              <th style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>Siri / Alexa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { f: 'Multi-Agent Planning', n: 'Yes (Agentic Chain-of-Thought)', o: 'Limited (Linear)', a: 'No (Render focus)', s: 'No (Intent parsing)' },
                              { f: 'Autonomous ERP Write Actions', n: 'Yes (SAP/Odoo hooks)', o: 'No (Browser macros only)', a: 'No', s: 'No' },
                              { f: 'Real-time 4D Metahuman Rendering', n: 'Yes (Audio2Face + WebGL)', o: 'No (Static/Text)', a: 'Yes (Native UE5)', s: 'No' },
                              { f: 'Food Order Checkout Engine', n: 'Yes (Unified Delivery API)', o: 'No (Assisted search)', a: 'No', s: 'No (Simple skill)' },
                              { f: 'Zero-Trust Security (HIPAA/ZATCA)', n: 'Yes (Enforced OIDC/PGP)', o: 'No', a: 'No', s: 'No' }
                            ].map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                                <td style={{ padding: '6px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>{row.f}</td>
                                <td style={{ padding: '6px 10px', color: 'var(--success-color)', fontWeight: '700' }}>{row.n}</td>
                                <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{row.o}</td>
                                <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{row.a}</td>
                                <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{row.s}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ARCHITECTURE BLUEPRINTS */}
                  {activeNovaSubTab === 'blueprints' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        Review standard architectural blueprints compiled by our AI Architects Team:
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { title: '1. Event-Driven Microservices', lines: ['Apache Kafka Event Stream', 'Kubernetes Orchestration Node', 'FastAPI REST / gRPC Gateways'] },
                          { title: '2. Vector Memory Architecture', lines: ['pgvector (PostgreSQL 1536-dim)', 'Neo4j Enterprise Knowledge Graph', 'Redis In-Memory Session Cache'] },
                          { title: '3. Low-Latency Voice Engine', lines: ['WebRTC Audio Media Loop (microphone)', 'Whisper Live ASR transcription', 'ElevenLabs Realtime TTS synthesizer'] },
                          { title: '4. Enterprise Gateway Security', lines: ['OIDC OAuth2 Oauth Gateways', 'GnuPG PGP Encryption packages', 'ABAC / RBAC Data Access Layers'] }
                        ].map((blueprint, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-card-hover)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px' }}>{blueprint.title}</span>
                            {blueprint.lines.map((ln, i) => (
                              <span key={i} style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-primary)' }}>• {ln}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Kiosk & QR Menu Tab View */}
        {activeTab === 'kiosk' && (
          <main className="page-content" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column: Kiosk Terminal Catalog */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <h3 className="card-title" style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={18} style={{ color: 'var(--primary-color)' }} />
                    Interactive Self-Service Kiosk Terminal
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    Kiosk Online Mode
                  </span>
                </div>

                {/* Category Filtering Bar */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['All', 'Coffee', 'Mains', 'Desserts', 'Drinks'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setKioskCategory(cat)}
                      className={`btn ${kioskCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px', height: 'auto', color: kioskCategory === cat ? '#ffffff' : 'var(--text-primary)', fontWeight: '600' }}
                    >
                      {cat === 'All' ? '🌐 All items' : cat === 'Coffee' ? '☕ Coffee' : cat === 'Mains' ? '🍔 Mains' : cat === 'Desserts' ? '🍰 Desserts' : '🥤 Drinks'}
                    </button>
                  ))}
                </div>

                {/* Product Grid showing high-res images */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px', maxHeight: '500px', overflowY: 'auto', padding: '4px' }}>
                  {products
                    .filter((p) => kioskCategory === 'All' || p.category === kioskCategory)
                    .map((p) => {
                      const invItem = inventory.find((i) => i.product.id === p.id);
                      const isOut = invItem && invItem.stock <= 0;

                      return (
                        <div
                          key={p.id}
                          style={{
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: isOut ? 'not-allowed' : 'pointer',
                            opacity: isOut ? 0.5 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => {
                            if (isOut) return;
                            setKioskCart((prev) => {
                              const existing = prev.find((item) => item.product.id === p.id);
                              if (existing) {
                                return prev.map((item) =>
                                  item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
                                );
                              }
                              return [...prev, { product: p, quantity: 1 }];
                            });
                            triggerToast(`Added ${p.name} to Kiosk order!`, 'success');
                          }}
                        >
                          {/* Product Image */}
                          <div style={{ height: '110px', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
                            {p.image ? (
                              <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                                {p.category === 'Coffee' && '☕'}
                                {p.category === 'Mains' && '🍔'}
                                {p.category === 'Desserts' && '🍰'}
                                {p.category === 'Drinks' && '🥤'}
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff', fontWeight: '700' }}>
                              {p.price.toFixed(2)} {getCurrency()}
                            </div>
                          </div>

                          {/* Info */}
                          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.category}</span>
                              {isOut && <span style={{ fontSize: '9px', color: 'var(--danger-color)', fontWeight: '700' }}>SOLD OUT</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Kiosk Checkout & QR Mobile Menu Simulator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Kiosk Cart panel */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  <h4 className="card-title" style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    <ShoppingBag size={16} style={{ color: 'var(--primary-color)' }} />
                    Self-Checkout Cart
                  </h4>

                  {kioskCart.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '180px' }}>
                      <span style={{ fontSize: '32px' }}>🛒</span>
                      <span style={{ fontSize: '12px', marginTop: '6px' }}>Select items to begin self-checkout</span>
                    </div>
                  ) : (
                    <>
                      {/* Cart List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
                        {kioskCart.map((item) => (
                          <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '60%' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.product.price.toFixed(2)} {getCurrency()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                className="btn"
                                style={{ width: '22px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                onClick={() => {
                                  setKioskCart((prev) =>
                                    prev
                                      .map((i) => (i.product.id === item.product.id ? { ...i, quantity: i.quantity - 1 } : i))
                                      .filter((i) => i.quantity > 0)
                                  );
                                }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.quantity}</span>
                              <button
                                className="btn"
                                style={{ width: '22px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                onClick={() => {
                                  setKioskCart((prev) =>
                                    prev.map((i) => (i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))
                                  );
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)' }}>
                          <span>Total Amount (incl VAT)</span>
                          <span style={{ fontWeight: '700' }}>
                            {kioskCart.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)} {getCurrency()}
                          </span>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', marginTop: '4px', color: '#ffffff' }}
                          onClick={() => {
                            const subtotal = kioskCart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
                            const taxRate = getTaxRate();
                            const tax = subtotal * taxRate;
                            const total = subtotal + tax;
                            const orderId = `ORD-KSK-${orders.length + 101}`;
                            const invoiceId = `INV-KSK-${String(invoices.length + 1).padStart(3, '0')}`;
                            const timestamp = new Date().toISOString();

                            const newOrder = {
                              id: orderId,
                              items: kioskCart.map((item) => ({ ...item, price: item.product.price })),
                              total: parseFloat(total.toFixed(2)),
                              status: 'pending',
                              timestamp,
                              invoiceId,
                              country,
                              source: 'kiosk'
                            };

                            const newInvoice = {
                              id: invoiceId,
                              orderId,
                              timestamp,
                              items: kioskCart.map((item) => ({ ...item, price: item.product.price })),
                              subtotal: parseFloat(subtotal.toFixed(2)),
                              tax: parseFloat(tax.toFixed(2)),
                              total: parseFloat(total.toFixed(2)),
                              country,
                              source: 'kiosk',
                              qrData: `CyShop Kiosk ${country} | Inv: ${invoiceId} | Total: ${total.toFixed(2)} ${getCurrency()}`
                            };

                            setOrders((prev) => [newOrder, ...prev]);
                            setInvoices((prev) => [newInvoice, ...prev]);
                            recordCheckoutJournalEntries('kiosk', subtotal, tax, invoiceId, kioskCart);
                            setKioskCart([]);
                            triggerToast(`Kiosk Checkout Completed! Ticket ${orderId} sent to Kitchen.`, 'success');
                            confetti({ particleCount: 100, spread: 50 });
                          }}
                        >
                          Place Order & Print Ticket
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* QR Mobile Menu Simulator */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '13.5px', fontWeight: '700' }}>
                    Scan QR Mobile Menu
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Customers can scan this QR code at their table to browse and order directly from their smartphones.
                  </p>

                  {/* Generated QR Code Graphic */}
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: '2px solid var(--primary-color)',
                      marginTop: '6px',
                      boxShadow: 'var(--shadow-natural)'
                    }}
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    {/* Mock QR graphic */}
                    <div style={{ width: '100px', height: '100px', display: 'flex', flexWrap: 'wrap' }}>
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 4 || i === 20 || i === 24 ? '#18181b' : '#ffffff'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--primary-color)', fontWeight: '700', marginTop: '4px' }}>
                    Click to Simulate Mobile Screen
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile QR Menu Simulation Popup */}
            {mobileMenuOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2000,
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '320px',
                    height: '560px',
                    background: 'var(--bg-card)',
                    border: '4px solid var(--border-color)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: 'var(--shadow-deep)'
                  }}
                >
                  {/* Phone Notch */}
                  <div style={{ width: '120px', height: '18px', background: '#000', borderRadius: '0 0 10px 10px', position: 'absolute', top: 0, left: '100px', zIndex: 10 }} />

                  {/* Header */}
                  <div style={{ background: 'var(--bg-card-hover)', padding: '24px 14px 10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>📱 QR Mobile Menu</span>
                    <button
                      className="btn"
                      style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Close
                    </button>
                  </div>

                  {/* Mobile Menu List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {products.map((p) => (
                      <div key={p.id} style={{ display: 'flex', gap: '10px', background: 'var(--bg-card-hover)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                              {p.category === 'Coffee' && '☕'}
                              {p.category === 'Mains' && '🍔'}
                              {p.category === 'Desserts' && '🍰'}
                              {p.category === 'Drinks' && '🥤'}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{p.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700', marginTop: '2px' }}>{p.price.toFixed(2)} {getCurrency()}</span>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ alignSelf: 'center', height: '26px', fontSize: '10px', padding: '0 8px', color: '#fff' }}
                          onClick={() => {
                            triggerToast(`Order submitted on smartphone for ${p.name}!`, 'success');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            HR MANAGEMENT MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'hr' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>👥 HR Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{employees.length} employees · {employees.filter(e => e.status === 'Active').length} active · {leaveRequests.filter(l => l.status === 'Pending').length} leave requests pending</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setHrTab('add'); setSelectedEmployee(null); }}><PlusCircle size={16} /> Add Employee</button>
            </div>

            <div className="tabs-container">
              {['directory', 'leave', 'add'].map(tab => (
                <button key={tab} className={`tab-btn ${hrTab === tab ? 'active' : ''}`} onClick={() => setHrTab(tab)}>
                  {tab === 'directory' ? '🏢 Directory' : tab === 'leave' ? '🏖 Leave Requests' : '➕ Add Employee'}
                </button>
              ))}
            </div>

            {hrTab === 'directory' && (
              <div className="split-pane">
                <div className="pane-main">
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
                    {[
                      { label: 'Total Employees', value: employees.length, icon: '👥', color: 'var(--primary-color)' },
                      { label: 'Active', value: employees.filter(e => e.status === 'Active').length, icon: '✅', color: 'var(--success-color)' },
                      { label: 'On Leave', value: employees.filter(e => e.status === 'On Leave').length, icon: '🏖', color: 'var(--warning-color)' },
                      { label: 'Total Payroll', value: employees.reduce((s, e) => s + e.baseSalary + e.allowances, 0).toLocaleString() + ' ' + getCurrency(), icon: '💰', color: 'var(--ai-glow-color)' }
                    ].map((k, i) => (
                      <div key={i} className="card kpi-card">
                        <div className="kpi-header">
                          <span className="kpi-label">{k.label}</span>
                          <span style={{ fontSize: '20px' }}>{k.icon}</span>
                        </div>
                        <div className="kpi-value" style={{ fontSize: '22px', color: k.color }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="table-container">
                    <div className="table-toolbar">
                      <span className="table-title">Employee Directory</span>
                      <span className="badge badge-ai"><Sparkles size={12} /> AI Screened</span>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th><th>Department</th><th>Role</th><th>Base Salary</th><th>Leave Balance</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map(emp => (
                          <tr key={emp.id} className={selectedEmployee?.id === emp.id ? 'active-row' : ''} onClick={() => setSelectedEmployee(emp)}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--ai-glow-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px' }}>
                                  {emp.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.id}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-info">{emp.dept}</span></td>
                            <td style={{ color: 'var(--text-muted)' }}>{emp.role}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-color)', fontWeight: '600' }}>{(emp.baseSalary + emp.allowances).toLocaleString()} {getCurrency()}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="sparkline-track"><div className="sparkline-fill" style={{ width: `${Math.min(100, emp.leaveBalance * 4)}%`, background: emp.leaveBalance > 10 ? 'var(--success-color)' : 'var(--warning-color)' }} /></div>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.leaveBalance}d</span>
                              </div>
                            </td>
                            <td><span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{emp.status}</span></td>
                            <td>
                              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)' }} onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); setHrTab('add'); }}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px', marginLeft: '4px' }} onClick={(e) => { e.stopPropagation(); setEmployees(prev => prev.filter(em => em.id !== emp.id)); triggerToast(`${emp.name} removed from HR`, 'info'); }}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {selectedEmployee && (
                  <div className="pane-side">
                    <div className="card" style={{ borderTop: '3px solid var(--primary-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Employee Profile</h3>
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelectedEmployee(null)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
                      </div>
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--ai-glow-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 auto 12px' }}>
                          {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{selectedEmployee.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedEmployee.role} · {selectedEmployee.dept}</div>
                      </div>
                      {[
                        ['Employee ID', selectedEmployee.id], ['Email', selectedEmployee.email], ['Phone', selectedEmployee.phone],
                        ['National ID', selectedEmployee.nationalId], ['Start Date', selectedEmployee.startDate],
                        ['Contract Type', selectedEmployee.contractType || 'Full-Time'],
                        ...(selectedEmployee.contractType === 'Hourly' ? [
                          ['Hourly Rate', `${(selectedEmployee.hourlyRate || 0).toLocaleString()} ${getCurrency()}/h`],
                          ['Overtime Multiplier', `${selectedEmployee.overtimeMultiplier || 1.5}x`]
                        ] : [
                          ['Base Salary', `${(selectedEmployee.baseSalary || 0).toLocaleString()} ${getCurrency()}`]
                        ]),
                        ['Allowances', `${(selectedEmployee.allowances || 0).toLocaleString()} ${getCurrency()}`],
                        ['Health Premium', `${(selectedEmployee.healthPremium || 0).toLocaleString()} ${getCurrency()} (Employer: ${selectedEmployee.employerHealthShare || 0}%)`],
                        ['Total CTC', selectedEmployee.contractType === 'Hourly' ? 'Hourly (based on work logs)' : `${Math.round((selectedEmployee.baseSalary + selectedEmployee.allowances) * 1.1425 + (selectedEmployee.healthPremium * selectedEmployee.employerHealthShare / 100)).toLocaleString()} ${getCurrency()}/mo`],
                        ['Leave Balance', `${selectedEmployee.leaveBalance} days`]
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{val}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ flex: 1, fontSize: '13px' }} onClick={() => { setLeaveRequests(prev => [...prev, { id: `LV-${Date.now()}`, empId: selectedEmployee.id, empName: selectedEmployee.name, type: 'Annual', from: today, to: today, days: 1, status: 'Pending', reason: 'Auto request' }]); triggerToast(`Leave request submitted for ${selectedEmployee.name}`, 'success'); }}>Request Leave</button>
                        <button className="btn btn-secondary" style={{ flex: 1, fontSize: '13px' }} onClick={() => { setActiveTab('payroll'); triggerToast('Viewing payroll for ' + selectedEmployee.name, 'info'); }}>View Payslip</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hrTab === 'leave' && (
              <div className="table-container">
                <div className="table-toolbar">
                  <span className="table-title">Leave Requests</span>
                  <span style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-warning">{leaveRequests.filter(l => l.status === 'Pending').length} Pending</span>
                    <span className="badge badge-success">{leaveRequests.filter(l => l.status === 'Approved').length} Approved</span>
                  </span>
                </div>
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leaveRequests.map(lr => (
                      <tr key={lr.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{lr.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lr.empName}</td>
                        <td><span className="badge badge-info">{lr.type}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{lr.from}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{lr.to}</td>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{lr.days}</td>
                        <td style={{ color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lr.reason}</td>
                        <td><span className={`badge ${lr.status === 'Approved' ? 'badge-success' : lr.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{lr.status}</span></td>
                        <td style={{ display: 'flex', gap: '4px' }}>
                          {lr.status === 'Pending' && <>
                            <button className="btn btn-success" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => { setLeaveRequests(prev => prev.map(l => l.id === lr.id ? { ...l, status: 'Approved' } : l)); triggerToast(`Leave approved for ${lr.empName}`, 'success'); }}>Approve</button>
                            <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => { setLeaveRequests(prev => prev.map(l => l.id === lr.id ? { ...l, status: 'Rejected' } : l)); triggerToast(`Leave rejected for ${lr.empName}`, 'info'); }}>Reject</button>
                          </>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hrTab === 'add' && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card">
                  <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>{selectedEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="input" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} placeholder="e.g. Ahmad Al-Sayed" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="select" value={newEmpDept} onChange={e => setNewEmpDept(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                        {['Operations', 'Kitchen', 'Finance', 'IT', 'Delivery', 'Management'].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Job Role *</label>
                      <input className="input" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} placeholder="e.g. Shift Supervisor" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contract Type</label>
                      <select className="select" value={newEmpContractType} onChange={e => setNewEmpContractType(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                        {['Full-Time', 'Part-Time', 'Hourly'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {newEmpContractType === 'Hourly' ? (
                      <div className="form-group">
                        <label className="form-label">Hourly Rate ({getCurrency()}) *</label>
                        <input className="input" type="number" value={newEmpHourlyRate} onChange={e => setNewEmpHourlyRate(e.target.value)} placeholder="e.g. 15" style={{ color: 'var(--text-primary)' }} />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Base Salary ({getCurrency()})</label>
                        <input className="input" type="number" value={newEmpSalary} onChange={e => setNewEmpSalary(e.target.value)} placeholder="e.g. 2500" style={{ color: 'var(--text-primary)' }} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Monthly Allowances ({getCurrency()})</label>
                      <input className="input" type="number" value={newEmpAllowance} onChange={e => setNewEmpAllowance(e.target.value)} placeholder="e.g. 400" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Overtime Multiplier</label>
                      <input className="input" type="number" step="0.1" value={newEmpOvertimeMultiplier} onChange={e => setNewEmpOvertimeMultiplier(e.target.value)} placeholder="e.g. 1.5" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Health Premium ({getCurrency()})</label>
                      <input className="input" type="number" value={newEmpHealthPremium} onChange={e => setNewEmpHealthPremium(e.target.value)} placeholder="e.g. 100" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employer Health Share (%)</label>
                      <input className="input" type="number" min="0" max="100" value={newEmpEmployerHealthShare} onChange={e => setNewEmpEmployerHealthShare(e.target.value)} placeholder="e.g. 80" style={{ color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div className="ai-glow-panel" style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--ai-glow-color)' }} />
                      <span style={{ fontWeight: '700', color: 'var(--ai-glow-color)', fontSize: '13px' }}>AI CV Screener</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Paste candidate CV text below for AI scoring and role matching:</p>
                    <textarea className="input" rows={4} placeholder="Paste CV content here... AI will extract skills, experience, and match to role automatically." style={{ resize: 'vertical', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} onChange={e => { if (e.target.value.length > 50) { setTimeout(() => triggerToast('AI extracted: 5 years experience, degree in Business. 87% match score for this role!', 'success'), 800); }}} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                      if (!newEmpName || !newEmpRole) { triggerToast('Name and Role are required', 'error'); return; }
                      if (selectedEmployee) {
                        setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? {
                          ...emp,
                          name: newEmpName,
                          dept: newEmpDept,
                          role: newEmpRole,
                          baseSalary: newEmpContractType === 'Hourly' ? 0 : parseFloat(newEmpSalary) || 0,
                          allowances: parseFloat(newEmpAllowance) || 0,
                          contractType: newEmpContractType,
                          hourlyRate: parseFloat(newEmpHourlyRate) || 0,
                          overtimeMultiplier: parseFloat(newEmpOvertimeMultiplier) || 1.5,
                          healthPremium: parseFloat(newEmpHealthPremium) || 0,
                          employerHealthShare: parseFloat(newEmpEmployerHealthShare) || 0
                        } : emp));
                        triggerToast(`Employee ${newEmpName} updated successfully!`, 'success');
                      } else {
                        const newEmp = {
                          id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
                          name: newEmpName,
                          dept: newEmpDept,
                          role: newEmpRole,
                          status: 'Active',
                          startDate: today,
                          baseSalary: newEmpContractType === 'Hourly' ? 0 : parseFloat(newEmpSalary) || 0,
                          allowances: parseFloat(newEmpAllowance) || 0,
                          email: `${newEmpName.toLowerCase().replace(' ', '.')}@cyshop.com`,
                          phone: '',
                          leaveBalance: 21,
                          nationalId: '',
                          contractType: newEmpContractType,
                          hourlyRate: parseFloat(newEmpHourlyRate) || 0,
                          overtimeMultiplier: parseFloat(newEmpOvertimeMultiplier) || 1.5,
                          healthPremium: parseFloat(newEmpHealthPremium) || 0,
                          employerHealthShare: parseFloat(newEmpEmployerHealthShare) || 0
                        };
                        setEmployees(prev => [...prev, newEmp]);
                        triggerToast(`Employee ${newEmpName} added to HR system!`, 'success');
                      }
                      setNewEmpName(''); setNewEmpRole(''); setNewEmpSalary(''); setNewEmpAllowance('');
                      setSelectedEmployee(null);
                      setHrTab('directory');
                      confetti({ particleCount: 60, spread: 50 });
                    }}>Save Employee</button>
                    <button className="btn btn-secondary" onClick={() => { setSelectedEmployee(null); setHrTab('directory'); }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ATTENDANCE MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'attendance' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>⏱ Attendance Tracker</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Date: {today} · {attendanceLogs.filter(a => a.date === today).length} employees clocked in today</p>
              </div>
            </div>

            {/* Clock In/Out Panel */}
            <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
              <div className="card ai-border-glow">
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Clock In / Out</h3>
                <div className="form-group">
                  <label className="form-label">Select Employee</label>
                  <select className="select" value={clockingEmployee} onChange={e => setClockingEmployee(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                {/* Biometric Mock */}
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>👁️</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Facial Recognition / Fingerprint Scanner</p>
                  <div style={{ fontSize: '11px', color: 'var(--success-color)', fontWeight: '600', background: 'var(--success-bg)', padding: '4px 12px', borderRadius: '20px', display: 'inline-block' }}>● SENSOR ONLINE</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>GPS: {attendanceLogs[0]?.gps || '24.7136° N, 46.6753° E'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success" style={{ flex: 1, fontSize: '13px' }} onClick={() => {
                    const emp = employees.find(e => e.id === clockingEmployee);
                    const existing = attendanceLogs.find(a => a.empId === clockingEmployee && a.date === today);
                    if (existing && !existing.clockOut) { triggerToast(`${emp?.name} is already clocked in!`, 'error'); return; }
                    const newLog = { id: `ATT-${Date.now()}`, empId: clockingEmployee, empName: emp?.name || '', date: today, clockIn: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), clockOut: null, hoursWorked: null, regularHours: 0, overtimeHours: 0, approvalStatus: 'Pending', status: 'Active', gps: '24.7136° N, 46.6753° E' };
                    setAttendanceLogs(prev => [...prev, newLog]);
                    triggerToast(`✅ ${emp?.name} clocked IN at ${newLog.clockIn}`, 'success');
                  }}>Clock In</button>
                  <button className="btn btn-danger" style={{ flex: 1, fontSize: '13px' }} onClick={() => {
                    const emp = employees.find(e => e.id === clockingEmployee);
                    const existing = attendanceLogs.find(a => a.empId === clockingEmployee && a.date === today && !a.clockOut);
                    if (!existing) { triggerToast(`${emp?.name} has not clocked in!`, 'error'); return; }
                    const clockOut = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                    const [inH, inM] = existing.clockIn.split(':').map(Number);
                    const [outH, outM] = clockOut.split(':').map(Number);
                    const hours = parseFloat(((outH * 60 + outM - inH * 60 - inM) / 60).toFixed(2));
                    const regularHours = Math.min(8.0, hours);
                    const overtimeHours = Math.max(0.0, hours - 8.0);
                    setAttendanceLogs(prev => prev.map(a => a.id === existing.id ? { ...a, clockOut, hoursWorked: hours, regularHours, overtimeHours, status: 'Present', approvalStatus: 'Pending' } : a));
                    triggerToast(`✅ ${emp?.name} clocked OUT. Hours worked: ${hours}h`, 'success');
                  }}>Clock Out</button>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Today's Attendance Log — {today}</h3>
                <table className="data-table">
                  <thead><tr><th>Employee</th><th>Clock In</th><th>Clock Out</th><th>Regular</th><th>Overtime</th><th>Total</th><th>Status</th><th>Work Entry Approval</th><th>Actions</th></tr></thead>
                  <tbody>
                    {attendanceLogs.filter(a => a.date === today).map(log => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.empName}</td>
                        <td style={{ color: 'var(--success-color)', fontFamily: 'var(--font-mono)' }}>{log.clockIn}</td>
                        <td style={{ color: log.clockOut ? 'var(--text-muted)' : 'var(--warning-color)', fontFamily: 'var(--font-mono)' }}>{log.clockOut || '– active –'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{log.clockOut ? `${log.regularHours}h` : '–'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning-color)', fontWeight: '600' }}>{log.clockOut ? `${log.overtimeHours}h` : '–'}</td>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{log.hoursWorked ? `${log.hoursWorked}h` : '–'}</td>
                        <td><span className={`badge ${log.status === 'Present' ? 'badge-success' : log.status === 'Active' ? 'badge-info' : log.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{log.status}</span></td>
                        <td>
                          <span className={`badge ${log.approvalStatus === 'Approved' ? 'badge-success' : log.approvalStatus === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {log.approvalStatus}
                          </span>
                        </td>
                        <td>
                          {log.clockOut && log.approvalStatus === 'Pending' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn-success"
                                style={{ padding: '3px 8px', fontSize: '10.5px', height: 'auto' }}
                                onClick={() => {
                                  setAttendanceLogs(prev => prev.map(a => a.id === log.id ? { ...a, approvalStatus: 'Approved' } : a));
                                  triggerToast(`Approved hours for ${log.empName}`, 'success');
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '3px 8px', fontSize: '10.5px', height: 'auto' }}
                                onClick={() => {
                                  setAttendanceLogs(prev => prev.map(a => a.id === log.id ? { ...a, approvalStatus: 'Rejected' } : a));
                                  triggerToast(`Rejected hours for ${log.empName}`, 'info');
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {attendanceLogs.filter(a => a.date === today).length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No attendance records for today yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Monthly Summary</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Month:</label>
                  <input type="month" className="input" style={{ width: 'auto', height: '36px', color: 'var(--text-primary)' }} value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {employees.map(emp => {
                  const empLogs = attendanceLogs.filter(a => a.empId === emp.id && a.date.startsWith(attendanceMonth));
                  const approvedLogs = empLogs.filter(a => a.approvalStatus === 'Approved');
                  const regHours = approvedLogs.reduce((s, a) => s + (a.regularHours || 0), 0);
                  const otHours = approvedLogs.reduce((s, a) => s + (a.overtimeHours || 0), 0);
                  const presentDays = empLogs.filter(a => a.status === 'Present' || a.status === 'Active').length;
                  return (
                    <div key={emp.id} className="card" style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.role} ({emp.contractType})</div>
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{presentDays}d</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Days</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-color)' }}>{regHours.toFixed(1)}h</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Approved Reg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--warning-color)' }}>{otHours.toFixed(1)}h</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Approved OT</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PAYROLL MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'payroll' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>💰 Payroll Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Current period: {payrollMonth} · {employees.length} employees</p>
              </div>
              <button className="btn btn-ai" disabled={payrollProcessing} onClick={() => {
                setPayrollProcessing(true);
                triggerToast('Processing payroll calculations with AI anomaly detection...', 'info');
                setTimeout(() => {
                  const runId = `PAY-2026-${String(payrollRuns.length + 1).padStart(2, '0')}`;
                  const newRun = {
                    id: runId,
                    month: payrollMonth,
                    processedDate: today,
                    employees: employees.length,
                    totalGross,
                    totalDeductions,
                    totalNet,
                    totalLiabilities,
                    status: 'Processed'
                  };

                  // Post general ledger double-entry journal entries
                  const salaryExpenseJE = {
                    id: `JE-PAY-EXP-${Date.now()}-1`,
                    date: today,
                    description: `Payroll Run Salaries Expense - ${payrollMonth}`,
                    debitAccount: '5100 Salaries Expense',
                    creditAccount: '2200 Salary Payable',
                    debitAmount: totalNet,
                    creditAmount: totalNet,
                    ref: runId
                  };

                  const payrollLiabJE = {
                    id: `JE-PAY-LIAB-${Date.now()}-2`,
                    date: today,
                    description: `Payroll Run Liabilities (Taxes & Social Shares) - ${payrollMonth}`,
                    debitAccount: '5100 Salaries Expense',
                    creditAccount: '2300 Payroll Liabilities',
                    debitAmount: totalLiabilities,
                    creditAmount: totalLiabilities,
                    ref: runId
                  };

                  setJournalEntries(prev => [...prev, salaryExpenseJE, payrollLiabJE]);
                  setPayrollRuns(prev => [newRun, ...prev]);
                  setPayrollProcessing(false);
                  triggerToast(`✅ Payroll for ${payrollMonth} processed! Total Net: ${totalNet.toLocaleString()} ${getCurrency()} (Ledger entries posted)`, 'success');
                  confetti({ particleCount: 100, spread: 60 });
                }, 2000);
              }}>
                {payrollProcessing ? '⏳ Processing...' : <><Sparkles size={16} /> Run Payroll</>}
              </button>
            </div>

            <div className="tabs-container">
              {['current', 'history'].map(tab => (
                <button key={tab} className={`tab-btn ${payrollTab === tab ? 'active' : ''}`} onClick={() => setPayrollTab(tab)}>
                  {tab === 'current' ? '📊 Current Period' : '📋 History'}
                </button>
              ))}
            </div>

            {payrollTab === 'current' && (
              <div>
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Gross', value: totalGross.toLocaleString(), suffix: getCurrency(), color: 'var(--primary-color)' },
                    { label: 'Deductions (SSC & Tax)', value: totalDeductions.toLocaleString(), suffix: getCurrency(), color: 'var(--danger-color)' },
                    { label: 'Net Payable', value: totalNet.toLocaleString(), suffix: getCurrency(), color: 'var(--success-color)' },
                    { label: 'Employees', value: employees.length, suffix: 'staff', color: 'var(--ai-glow-color)' }
                  ].map((k, i) => (
                    <div key={i} className="card kpi-card">
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-value" style={{ color: k.color, fontSize: '22px' }}>{k.value} <span style={{ fontSize: '14px' }}>{k.suffix}</span></div>
                    </div>
                  ))}
                </div>

                <div className="ai-glow-panel" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={16} style={{ color: 'var(--ai-glow-color)' }} /><span style={{ fontWeight: '700', color: 'var(--ai-glow-color)' }}>AI Payroll Audit — {payrollMonth}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>✅ Calculations verified. Social security split (employer 14.25% / employee 7.5%) and income tax (5% flat) computed dynamically. Work entries approved feed into payroll calculations correctly.</p>
                </div>

                <div className="table-container">
                  <div className="table-toolbar"><span className="table-title">Employee Payroll Breakdown</span></div>
                  <table className="data-table">
                    <thead><tr><th>Employee</th><th>Role</th><th>Contract</th><th>Base/Hours</th><th>Allowances</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                    <tbody>
                      {payrollList.map(item => {
                        return (
                          <tr key={item.empId}>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{item.role}</td>
                            <td><span className="badge badge-info">{item.contractType}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>
                              {item.contractType === 'Hourly' ? `${(item.regHours + item.otHours).toFixed(1)}h (${item.regHours} reg / ${item.otHours} OT)` : `${Math.round(item.baseSalary).toLocaleString()}`}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{item.allowances.toLocaleString()}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--primary-color)' }}>{item.gross.toLocaleString()}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)' }}>({item.deductions.toLocaleString()})</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--success-color)' }}>{item.net.toLocaleString()} {getCurrency()}</td>
                            <td><span className="badge badge-warning">Pending</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {payrollTab === 'history' && (
              <div className="table-container">
                <div className="table-toolbar"><span className="table-title">Payroll Run History</span></div>
                <table className="data-table">
                  <thead><tr><th>Run ID</th><th>Period</th><th>Processed</th><th>Employees</th><th>Total Gross</th><th>Deductions</th><th>Net Paid</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {payrollRuns.map(run => (
                      <tr key={run.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{run.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{run.month}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{run.processedDate}</td>
                        <td>{run.employees}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{run.totalGross.toLocaleString()}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)' }}>({run.totalDeductions.toLocaleString()})</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--success-color)' }}>{run.totalNet.toLocaleString()} {getCurrency()}</td>
                        <td><span className={`badge ${run.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{run.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--text-primary)' }} onClick={() => triggerToast(`Payslips for ${run.month} downloaded!`, 'success')}>📄 Payslips</button>
                            {run.status === 'Processed' && (
                              <button className="btn btn-success" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => {
                                const settleNetJE = {
                                  id: `JE-PAY-NET-${Date.now()}`,
                                  date: today,
                                  description: `Salary Payout - ${run.month}`,
                                  debitAccount: '2200 Salary Payable',
                                  creditAccount: '1001 Cash & Bank',
                                  debitAmount: run.totalNet,
                                  creditAmount: run.totalNet,
                                  ref: run.id
                                };
                                const settleLiabJE = {
                                  id: `JE-PAY-LIAB-${Date.now()}`,
                                  date: today,
                                  description: `Payroll Liabilities Settlement - ${run.month}`,
                                  debitAccount: '2300 Payroll Liabilities',
                                  creditAccount: '1001 Cash & Bank',
                                  debitAmount: run.totalLiabilities || run.totalDeductions,
                                  creditAmount: run.totalLiabilities || run.totalDeductions,
                                  ref: run.id
                                };
                                setJournalEntries(prev => [...prev, settleNetJE, settleLiabJE]);
                                setPayrollRuns(prev => prev.map(r => r.id === run.id ? { ...r, status: 'Paid' } : r));
                                triggerToast(`Salary payment processed! Paid ${run.totalNet} Net, Settled ${run.totalLiabilities || run.totalDeductions} Liabilities.`, 'success');
                                confetti({ particleCount: 150, spread: 80 });
                              }}>Pay Salaries</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ACCOUNTING MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'accounting' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>📒 Accounting & Finance</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Double-entry bookkeeping · VAT compliance · P&L reports</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ color: 'var(--text-primary)' }} onClick={() => triggerToast('P&L Report exported to PDF!', 'success')}>📊 Export P&L</button>
                <button className="btn btn-primary" onClick={() => setAccountingTab('journal')}>+ Journal Entry</button>
              </div>
            </div>

            <div className="tabs-container">
              {['ledger', 'journal', 'expenses', 'reports'].map(tab => (
                <button key={tab} className={`tab-btn ${accountingTab === tab ? 'active' : ''}`} onClick={() => setAccountingTab(tab)}>
                  {tab === 'ledger' ? '📘 Chart of Accounts' : tab === 'journal' ? '📝 Journal Entries' : tab === 'expenses' ? '💸 Expenses Registry' : '📊 Reports & VAT'}
                </button>
              ))}
            </div>

            {accountingTab === 'ledger' && (
              <div>
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                  {['Asset', 'Liability', 'Revenue', 'Expense'].map(type => {
                    const total = chartOfAccounts.filter(a => a.type === type).reduce((s, a) => s + a.balance, 0);
                    const colors = { Asset: 'var(--primary-color)', Liability: 'var(--danger-color)', Revenue: 'var(--success-color)', Expense: 'var(--warning-color)' };
                    return (
                      <div key={type} className="card kpi-card">
                        <div className="kpi-label">{type} Accounts</div>
                        <div className="kpi-value" style={{ color: colors[type], fontSize: '20px' }}>{total.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getCurrency()} · {chartOfAccounts.filter(a => a.type === type).length} accounts</div>
                      </div>
                    );
                  })}
                </div>
                <div className="table-container">
                  <div className="table-toolbar"><span className="table-title">Chart of Accounts</span><span className="badge badge-ai"><Sparkles size={12} /> IFRS Compliant</span></div>
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Account Name</th><th>Type</th><th>Balance ({getCurrency()})</th></tr></thead>
                    <tbody>
                      {chartOfAccounts.map(acc => (
                        <tr key={acc.code}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{acc.code}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{acc.name}</td>
                          <td><span className={`badge ${acc.type === 'Asset' ? 'badge-info' : acc.type === 'Liability' ? 'badge-danger' : acc.type === 'Revenue' ? 'badge-success' : 'badge-warning'}`}>{acc.type}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: acc.type === 'Expense' || acc.type === 'Liability' ? 'var(--danger-color)' : 'var(--success-color)' }}>{acc.balance.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {accountingTab === 'journal' && (
              <div>
                <div className="card" style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>📝 New Journal Entry</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Description</label>
                      <input className="input" value={newJEDesc} onChange={e => setNewJEDesc(e.target.value)} placeholder="Transaction description..." style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Debit Account</label>
                      <select className="select" value={newJEDebit} onChange={e => setNewJEDebit(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                        <option value="">Select account</option>
                        {chartOfAccounts.map(a => <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} - {a.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Credit Account</label>
                      <select className="select" value={newJECredit} onChange={e => setNewJECredit(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                        <option value="">Select account</option>
                        {chartOfAccounts.map(a => <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} - {a.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label">Amount</label>
                        <input className="input" type="number" value={newJEAmount} onChange={e => setNewJEAmount(e.target.value)} placeholder="0.00" style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <button className="btn btn-primary" style={{ height: '42px' }} onClick={() => {
                        if (!newJEDesc || !newJEDebit || !newJECredit || !newJEAmount) { triggerToast('All fields required', 'error'); return; }
                        const entry = { id: `JE-${String(journalEntries.length + 1).padStart(3, '0')}`, date: today, description: newJEDesc, debitAccount: newJEDebit, creditAccount: newJECredit, debitAmount: parseFloat(newJEAmount), creditAmount: parseFloat(newJEAmount), ref: 'MANUAL' };
                        setJournalEntries(prev => [entry, ...prev]);
                        setNewJEDesc(''); setNewJEDebit(''); setNewJECredit(''); setNewJEAmount('');
                        triggerToast('Journal entry posted!', 'success');
                      }}>Post</button>
                    </div>
                  </div>
                </div>
                <div className="table-container">
                  <div className="table-toolbar"><span className="table-title">General Ledger Journal</span></div>
                  <table className="data-table">
                    <thead><tr><th>Entry ID</th><th>Date</th><th>Description</th><th>Debit Account</th><th>Credit Account</th><th>Amount ({getCurrency()})</th><th>Reference</th></tr></thead>
                    <tbody>
                      {journalEntries.map(je => (
                        <tr key={je.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{je.id}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{je.date}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{je.description}</td>
                          <td style={{ color: 'var(--danger-color)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>DR: {je.debitAccount}</td>
                          <td style={{ color: 'var(--success-color)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>CR: {je.creditAccount}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>{je.debitAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{je.ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {accountingTab === 'expenses' && (() => {
              const overheadExpenses = journalEntries.filter(
                je => je.ref === 'OVERHEAD' || je.debitAccount.startsWith('5200') || je.debitAccount.startsWith('5300')
              );
              return (
                <div>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>💸 Record Overhead Expense</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Expense Description *</label>
                        <input
                          className="input"
                          value={expenseDesc}
                          onChange={e => setExpenseDesc(e.target.value)}
                          placeholder="e.g. Monthly Restaurant Rent, June Water Bill..."
                          style={{ color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Expense Category *</label>
                        <select
                          className="select"
                          value={expenseAccount}
                          onChange={e => setExpenseAccount(e.target.value)}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <option value="5200 Rent Expense">5200 - Rent Expense</option>
                          <option value="5300 Utilities Expense">5300 - Utilities Expense</option>
                          <option value="5100 Salaries Expense">5100 - Salaries Expense</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="input"
                          value={expenseDate}
                          onChange={e => setExpenseDate(e.target.value)}
                          style={{ color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                          <label className="form-label">Amount ({getCurrency()}) *</label>
                          <input
                            className="input"
                            type="number"
                            value={expenseAmount}
                            onChange={e => setExpenseAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ color: 'var(--text-primary)' }}
                          />
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ height: '42px' }}
                          onClick={() => {
                            if (!expenseDesc || !expenseAmount) {
                              triggerToast('Description and Amount are required', 'error');
                              return;
                            }
                            const entry = {
                              id: `JE-EXP-${Date.now()}`,
                              date: expenseDate || today,
                              description: expenseDesc,
                              debitAccount: expenseAccount,
                              creditAccount: '1001 Cash & Bank',
                              debitAmount: parseFloat(expenseAmount),
                              creditAmount: parseFloat(expenseAmount),
                              ref: 'OVERHEAD'
                            };
                            setJournalEntries(prev => [entry, ...prev]);
                            setExpenseDesc('');
                            setExpenseAmount('');
                            setExpenseDate(today);
                            triggerToast(`Overhead expense logged to ${expenseAccount}!`, 'success');
                            confetti({ particleCount: 50, spread: 40 });
                          }}
                        >
                          Log Expense
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <div className="table-toolbar">
                      <span className="table-title">Overhead Expenses Log</span>
                      <span className="badge badge-ai">Paid via Cash & Bank</span>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Entry ID</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Expense Account</th>
                          <th>Payment Account</th>
                          <th>Amount ({getCurrency()})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overheadExpenses.map(je => (
                          <tr key={je.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{je.id}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{je.date}</td>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{je.description}</td>
                            <td style={{ color: 'var(--danger-color)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{je.debitAccount}</td>
                            <td style={{ color: 'var(--success-color)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{je.creditAccount}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {je.debitAmount.toLocaleString('en', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        {overheadExpenses.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                              No overhead expenses recorded yet. Use the form above to log expenses.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {accountingTab === 'reports' && (() => {
              const salesRev = chartOfAccounts.find(a => a.code === '4001')?.balance || 0;
              const delivRev = chartOfAccounts.find(a => a.code === '4100')?.balance || 0;
              const cogs = chartOfAccounts.find(a => a.code === '5001')?.balance || 0;
              const salariesExp = chartOfAccounts.find(a => a.code === '5100')?.balance || 0;
              const rentExp = chartOfAccounts.find(a => a.code === '5200')?.balance || 0;
              const utilitiesExp = chartOfAccounts.find(a => a.code === '5300')?.balance || 0;
              
              const netProfitVal = salesRev + delivRev - cogs - salariesExp - rentExp - utilitiesExp;

              const cashBalance = chartOfAccounts.find(a => a.code === '1001')?.balance || 0;
              const recBalance = chartOfAccounts.find(a => a.code === '1100')?.balance || 0;
              const invBalance = chartOfAccounts.find(a => a.code === '1200')?.balance || 0;
              const assetsTotal = cashBalance + recBalance + invBalance;

              const apBalance = chartOfAccounts.find(a => a.code === '2001')?.balance || 0;
              const vatBalance = chartOfAccounts.find(a => a.code === '2100')?.balance || 0;
              const salPayable = chartOfAccounts.find(a => a.code === '2200')?.balance || 0;
              const payLiab = chartOfAccounts.find(a => a.code === '2300')?.balance || 0;
              const liabilitiesTotal = apBalance + vatBalance + salPayable + payLiab;

              const equityBase = chartOfAccounts.find(a => a.code === '3001')?.balance || 0;
              const equityTotal = equityBase + netProfitVal;

              const balanceSheetBalanced = Math.abs(assetsTotal - (liabilitiesTotal + equityTotal)) < 0.05;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Financial Statements Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    {/* Profit & Loss Card */}
                    <div className="card">
                      <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>📊 Profit & Loss Statement</h3>
                      {[
                        { label: 'Sales Revenue', val: salesRev, type: 'income' },
                        { label: 'Delivery Revenue', val: delivRev, type: 'income' },
                        { label: 'Cost of Goods Sold (COGS)', val: -cogs, type: 'expense' },
                        { label: 'Salaries Expense', val: -salariesExp, type: 'expense' },
                        { label: 'Rent Expense', val: -rentExp, type: 'expense' },
                        { label: 'Utilities Expense', val: -utilitiesExp, type: 'expense' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                          <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: item.val >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {item.val >= 0 ? '+' : ''}{item.val.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: '16px', fontWeight: '800', borderTop: '2px solid var(--text-primary)', marginTop: '8px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Net Profit</span>
                        <span style={{ color: netProfitVal >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontFamily: 'var(--font-mono)' }}>
                          {netProfitVal >= 0 ? '+' : ''}{netProfitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                        </span>
                      </div>
                    </div>

                    {/* Balance Sheet Card */}
                    <div className="card">
                      <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>⚖️ Balance Sheet</h3>
                      
                      {/* Assets Section */}
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '8px' }}>Assets</h4>
                        {[
                          { label: 'Cash & Bank', val: cashBalance },
                          { label: 'Accounts Receivable', val: recBalance },
                          { label: 'Inventory Assets', val: invBalance }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>
                              {item.val.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: '700', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Total Assets</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-color)' }}>
                            {assetsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                          </span>
                        </div>
                      </div>

                      {/* Liabilities Section */}
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger-color)', textTransform: 'uppercase', marginBottom: '8px' }}>Liabilities</h4>
                        {[
                          { label: 'Accounts Payable', val: apBalance },
                          { label: 'VAT Payable', val: vatBalance },
                          { label: 'Salary Payable', val: salPayable },
                          { label: 'Payroll Liabilities', val: payLiab }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>
                              {item.val.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: '700', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Total Liabilities</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)' }}>
                            {liabilitiesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                          </span>
                        </div>
                      </div>

                      {/* Equity Section */}
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success-color)', textTransform: 'uppercase', marginBottom: '8px' }}>Equity</h4>
                        {[
                          { label: 'Owner Equity', val: equityBase },
                          { label: 'Retained Earnings (Net Profit)', val: netProfitVal }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>
                              {item.val.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: '700', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Total Equity</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-color)' }}>
                            {equityTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrency()}
                          </span>
                        </div>
                      </div>

                      {/* Balance Check Indicator */}
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid ' + (balanceSheetBalanced ? 'var(--success-color)' : 'var(--danger-color)'),
                        background: balanceSheetBalanced ? 'var(--success-bg)' : 'var(--danger-bg)',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '13.5px',
                        color: balanceSheetBalanced ? 'var(--success-color)' : 'var(--danger-color)'
                      }}>
                        {balanceSheetBalanced ? (
                          <span>✅ Double-Entry Balanced: Assets ({assetsTotal.toLocaleString(undefined, {minimumFractionDigits:2})}) = Liabilities + Equity ({(liabilitiesTotal + equityTotal).toLocaleString(undefined, {minimumFractionDigits:2})})</span>
                        ) : (
                          <span>❌ Ledger Unbalanced: Assets ({assetsTotal.toLocaleString(undefined, {minimumFractionDigits:2})}) ≠ Liabilities + Equity ({(liabilitiesTotal + equityTotal).toLocaleString(undefined, {minimumFractionDigits:2})})</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* VAT Summary and Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="card">
                      <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>🏛 VAT Summary</h3>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>🇸🇦 ZATCA VAT (15%)</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success-color)' }}>{invoices.filter(i => i.country === 'SA').reduce((s, i) => s + i.tax, 0).toFixed(2)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SAR Collected</div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>🇯🇴 JoFawtara VAT (16%)</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--info-color)' }}>{invoices.filter(i => i.country === 'JO').reduce((s, i) => s + i.tax, 0).toFixed(2)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JOD Collected</div>
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { triggerToast('VAT return filed via ZATCA API!', 'success'); confetti({ particleCount: 60, spread: 50 }); }}>🇸🇦 File ZATCA VAT Return</button>
                      <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px', color: 'var(--text-primary)' }} onClick={() => triggerToast('VAT return filed via JoFawtara API!', 'success')}>🇯🇴 File JoFawtara VAT Return</button>
                    </div>
                    <div className="card">
                      <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>🤖 Tax & Compliance Advisor</h3>
                      <div className="ai-glow-panel" style={{ height: 'calc(100% - 48px)', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontWeight: '700', color: 'var(--ai-glow-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> AI Tax Recommendation</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>VAT filing deadline: 15th of next month. Current payable VAT: {(chartOfAccounts.find(a => a.code === '2100')?.balance || 0).toLocaleString()} {getCurrency()}. Recommend filing electronically via ZATCA / JoFawtara portals by June 30. Your system's double-entry accounting records are 100% balanced and ready for audit.</p>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })()}
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BOM & KITS (INVENTORY MANAGEMENT)
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'bom' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>🏗 Bill of Materials & Kits</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{bomItems.length} BOMs configured · Full ingredient cost breakdown</p>
              </div>
              <button className="btn btn-primary"><PlusCircle size={16} /> New BOM</button>
            </div>

            <div className="tabs-container">
              {['list', 'detail'].map(tab => (
                <button key={tab} className={`tab-btn ${bomTab === (selectedBom ? 'detail' : 'list') === (tab === 'detail') ? (tab === 'detail' ? 'active' : '') : (tab === 'list' ? 'active' : '')}`} onClick={() => { if (tab === 'list') setSelectedBom(null); }}>
                  {tab === 'list' ? '📋 All BOMs' : '🔍 BOM Detail'}
                </button>
              ))}
            </div>

            <div className="split-pane">
              <div className="pane-main">
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                  {[
                    { label: 'Total BOMs', value: bomItems.length, icon: '📋' },
                    { label: 'Avg. Food Cost %', value: (bomItems.reduce((s, b) => s + (100 - b.margin), 0) / bomItems.length).toFixed(1) + '%', icon: '🍳' },
                    { label: 'Avg. Gross Margin', value: (bomItems.reduce((s, b) => s + b.margin, 0) / bomItems.length).toFixed(1) + '%', icon: '💹' }
                  ].map((k, i) => (
                    <div key={i} className="card kpi-card">
                      <div className="kpi-header"><span className="kpi-label">{k.label}</span><span style={{ fontSize: '20px' }}>{k.icon}</span></div>
                      <div className="kpi-value" style={{ color: 'var(--primary-color)', fontSize: '22px' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div className="table-container">
                  <div className="table-toolbar"><span className="table-title">Bills of Materials</span><span className="badge badge-ai"><Sparkles size={12} /> Cost Intelligence</span></div>
                  <table className="data-table">
                    <thead><tr><th>BOM ID</th><th>Product</th><th>Type</th><th>Components</th><th>Total Cost</th><th>Sell Price</th><th>Gross Margin</th><th>Action</th></tr></thead>
                    <tbody>
                      {bomItems.map(bom => (
                        <tr key={bom.id} className={selectedBom?.id === bom.id ? 'active-row' : ''} onClick={() => setSelectedBom(bom)}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{bom.id}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{bom.name}</td>
                          <td><span className={`badge ${bom.type === 'Kit' ? 'badge-info' : 'badge-ai'}`}>{bom.type}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{bom.components.length} items</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)', fontWeight: '600' }}>{bom.totalCost.toFixed(2)} {getCurrency()}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-color)', fontWeight: '600' }}>{bom.sellPrice.toFixed(2)} {getCurrency()}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="sparkline-track" style={{ width: '60px' }}>
                                <div className="sparkline-fill" style={{ width: `${bom.margin}%`, background: bom.margin > 60 ? 'var(--success-color)' : bom.margin > 40 ? 'var(--warning-color)' : 'var(--danger-color)' }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{bom.margin}%</span>
                            </div>
                          </td>
                          <td><button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--text-primary)' }} onClick={(e) => { e.stopPropagation(); setSelectedBom(bom); }}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedBom && (
                <div className="pane-side">
                  <div className="card" style={{ borderTop: '3px solid var(--ai-glow-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>🔍 BOM Detail</h3>
                      <button className="btn btn-ghost btn-icon" onClick={() => setSelectedBom(null)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedBom.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Type: {selectedBom.type} · {selectedBom.components.length} components</div>
                    <div style={{ marginBottom: '16px' }}>
                      {selectedBom.components.map((comp, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{comp.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{comp.qty} {comp.unit}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)', fontWeight: '600' }}>{comp.cost.toFixed(2)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getCurrency()}/unit</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'var(--bg-card-hover)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Cost</span>
                        <span style={{ fontWeight: '700', color: 'var(--danger-color)', fontFamily: 'var(--font-mono)' }}>{selectedBom.totalCost.toFixed(2)} {getCurrency()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sell Price</span>
                        <span style={{ fontWeight: '700', color: 'var(--success-color)', fontFamily: 'var(--font-mono)' }}>{selectedBom.sellPrice.toFixed(2)} {getCurrency()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Gross Margin</span>
                        <span style={{ fontWeight: '800', color: selectedBom.margin > 60 ? 'var(--success-color)' : 'var(--warning-color)', fontFamily: 'var(--font-mono)' }}>{selectedBom.margin}%</span>
                      </div>
                    </div>
                    <button className="btn btn-ai" style={{ width: '100%', marginTop: '12px' }} onClick={() => triggerToast(`AI cost optimization suggestion: Switch to bulk ${selectedBom.components[0]?.name} — saves 12% per unit!`, 'success')}>
                      <Sparkles size={14} /> AI Cost Optimize
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SUPPLY CHAIN MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'supply' && (
          <main className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>🚚 Supply Chain Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{vendors.length} vendors · {purchaseOrders.length} purchase orders</p>
              </div>
              <button className="btn btn-primary" onClick={() => setSupplyTab('create-po')}><PlusCircle size={16} /> New Purchase Order</button>
            </div>

            <div className="tabs-container">
              {['vendors', 'orders', 'create-po'].map(tab => (
                <button key={tab} className={`tab-btn ${supplyTab === tab ? 'active' : ''}`} onClick={() => setSupplyTab(tab)}>
                  {tab === 'vendors' ? '🏭 Vendors' : tab === 'orders' ? '📋 Purchase Orders' : '➕ Create PO'}
                </button>
              ))}
            </div>

            {supplyTab === 'vendors' && (
              <div>
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                  {[
                    { label: 'Total Vendors', value: vendors.length },
                    { label: 'Avg. Rating', value: (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1) + ' ★' },
                    { label: 'Open Orders', value: purchaseOrders.filter(po => po.status === 'Pending').length }
                  ].map((k, i) => (
                    <div key={i} className="card kpi-card">
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-value" style={{ color: 'var(--primary-color)', fontSize: '22px' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {vendors.map(v => (
                    <div key={v.id} className="card" style={{ borderTop: '3px solid var(--primary-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{v.name}</div>
                          <span className="badge badge-info" style={{ fontSize: '11px' }}>{v.category}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: 'var(--warning-color)', fontSize: '16px' }}>{v.rating} ★</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.country === 'SA' ? '🇸🇦' : '🇯🇴'} {v.country}</div>
                        </div>
                      </div>
                      {[['Contact', v.contact], ['Payment', v.paymentTerms], ['Lead Time', v.leadTime]].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{val}</span>
                        </div>
                      ))}
                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', fontSize: '13px' }} onClick={() => { setNewPoVendor(v.id); setSupplyTab('create-po'); }}>Create PO</button>
                    </div>
                  ))}
                  <div className="card" style={{ border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', cursor: 'pointer' }} onClick={() => {
                    const name = prompt('Enter vendor name:');
                    if (name) { setVendors(prev => [...prev, { id: `VND-${String(prev.length + 1).padStart(3, '0')}`, name, contact: '', country: country, rating: 4.0, category: 'General', paymentTerms: 'Net 30', leadTime: '3 days' }]); triggerToast(`Vendor ${name} added!`, 'success'); }
                  }}>
                    <PlusCircle size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Add New Vendor</span>
                  </div>
                </div>
              </div>
            )}

            {supplyTab === 'orders' && (
              <div className="table-container">
                <div className="table-toolbar"><span className="table-title">Purchase Orders</span></div>
                <table className="data-table">
                  <thead><tr><th>PO Number</th><th>Vendor</th><th>Date</th><th>Items</th><th>Total</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {purchaseOrders.map(po => (
                      <tr key={po.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{po.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{po.vendor}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{po.date}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{po.items.length} items</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary-color)' }}>{po.total.toFixed(2)} {getCurrency()}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{po.dueDate}</td>
                        <td><span className={`badge ${po.status === 'Received' ? 'badge-success' : po.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{po.status}</span></td>
                        <td>
                          {po.status === 'Pending' && <button className="btn btn-success" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => {
                            setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, status: 'Received' } : p));
                            // Update inventory stock levels
                            setInventory(prevInv => prevInv.map(invItem => {
                              const matchedItem = po.items.find(pi => pi.name.toLowerCase().includes(invItem.product.name.toLowerCase()) || invItem.product.name.toLowerCase().includes(pi.name.toLowerCase()));
                              if (matchedItem) {
                                return { ...invItem, stock: invItem.stock + matchedItem.qty };
                              }
                              return invItem;
                            }));
                            // Post Accounts Payable journal entry
                            const poJE = {
                              id: `JE-PO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              date: today,
                              description: `Inventory Purchase - PO ${po.id} from ${po.vendor}`,
                              debitAccount: '1200 Inventory Assets',
                              creditAccount: '2001 Accounts Payable',
                              debitAmount: po.total,
                              creditAmount: po.total,
                              ref: po.id
                            };
                            setJournalEntries(prev => [...prev, poJE]);
                            triggerToast(`PO ${po.id} received and stock updated!`, 'success');
                          }}>Receive</button>}
                          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 8px', marginLeft: '4px', color: 'var(--text-primary)' }} onClick={() => triggerToast(`PO ${po.id} PDF downloaded!`, 'info')}>PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {supplyTab === 'create-po' && (
              <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div className="card">
                  <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>➕ New Purchase Order</h3>
                  <div className="form-group">
                    <label className="form-label">Vendor</label>
                    <select className="select" value={newPoVendor} onChange={e => setNewPoVendor(e.target.value)} style={{ color: 'var(--text-primary)' }}>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '12px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Item Name</label>
                      <input className="input" value={newPoItem} onChange={e => setNewPoItem(e.target.value)} placeholder="e.g. Coffee Beans 1kg" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Qty</label>
                      <input className="input" type="number" value={newPoQty} onChange={e => setNewPoQty(e.target.value)} placeholder="0" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Unit Price</label>
                      <input className="input" type="number" value={newPoPrice} onChange={e => setNewPoPrice(e.target.value)} placeholder="0.00" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <button className="btn btn-secondary" style={{ color: 'var(--text-primary)', height: '42px' }} onClick={() => {
                      if (!newPoItem || !newPoQty || !newPoPrice) { triggerToast('Fill all item fields', 'error'); return; }
                      setPoLines(prev => [...prev, { name: newPoItem, qty: parseInt(newPoQty), price: parseFloat(newPoPrice) }]);
                      setNewPoItem(''); setNewPoQty(''); setNewPoPrice('');
                    }}>Add Line</button>
                  </div>
                  {poLines.length > 0 && (
                    <div style={{ background: 'var(--bg-card-hover)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      {poLines.map((line, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{line.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{line.qty} × {line.price.toFixed(2)} = <strong style={{ color: 'var(--primary-color)' }}>{(line.qty * line.price).toFixed(2)} {getCurrency()}</strong></span>
                        </div>
                      ))}
                      <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                        Total: {poLines.reduce((s, l) => s + l.qty * l.price, 0).toFixed(2)} {getCurrency()}
                      </div>
                    </div>
                  )}
                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={poLines.length === 0} onClick={() => {
                    const vendor = vendors.find(v => v.id === newPoVendor);
                    const total = poLines.reduce((s, l) => s + l.qty * l.price, 0);
                    const newPO = { id: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`, vendor: vendor?.name || '', date: today, items: [...poLines], total, status: 'Pending', dueDate: today };
                    setPurchaseOrders(prev => [newPO, ...prev]);
                    setPoLines([]);
                    setSupplyTab('orders');
                    triggerToast(`Purchase Order ${newPO.id} sent to ${vendor?.name}!`, 'success');
                    confetti({ particleCount: 50, spread: 40 });
                  }}>Submit Purchase Order</button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SETUP WIZARD MODULE
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'setup' && (
          <main className="page-content" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '28px', color: 'white', boxShadow: 'var(--shadow-glow-orange)' }}>C</div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-display)', letterSpacing: '0.04em', background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>CYBERCOM ERP Setup</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Configure your ERP system step by step. Go live in minutes.</p>
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginBottom: '40px', overflowX: 'auto' }}>
              {['Business Info', 'Region & Tax', 'Modules', 'Admin Account', 'Review & Launch'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setSetupStep(i)}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: i <= setupStep ? 'var(--primary-color)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i <= setupStep ? 'white' : 'var(--text-muted)', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                      {i < setupStep ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: i === setupStep ? 'var(--primary-color)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{step}</span>
                  </div>
                  {i < 4 && <div style={{ width: '60px', height: '2px', background: i < setupStep ? 'var(--primary-color)' : 'var(--border-color)', margin: '-14px 4px 0', transition: 'background 0.3s' }} />}
                </div>
              ))}
            </div>

            {setupComplete ? (
              <div className="card ai-border-glow" style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Setup Complete!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>{setupConfig.businessName || 'Your business'} is live on CYBERCOM ERP.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-ai" onClick={() => { setActiveTab('dashboard'); triggerToast('CYBERCOM ERP is live. All systems operational.', 'success'); confetti({ particleCount: 200, spread: 120, colors: ['#ed6c00', '#59c3e1', '#ff8c35'] }); }}>Go to Dashboard</button>
                  <button className="btn btn-secondary" style={{ color: 'var(--text-primary)' }} onClick={() => setSetupComplete(false)}>Reconfigure</button>
                </div>
              </div>
            ) : (
              <div className="card">
                {setupStep === 0 && (
                  <div>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>🏢 Business Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Business Name *</label>
                        <input className="input" value={setupConfig.businessName} onChange={e => setSetupConfig(p => ({...p, businessName: e.target.value}))} placeholder="e.g. My Restaurant Ltd." style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Business Type</label>
                        <select className="select" value={setupConfig.businessType} onChange={e => setSetupConfig(p => ({...p, businessType: e.target.value}))} style={{ color: 'var(--text-primary)' }}>
                          {['Restaurant', 'Fast Food', 'Retail Store', 'Cafe', 'Supermarket', 'Cloud Kitchen'].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Number of Branches</label>
                        <input className="input" type="number" value={setupConfig.branches} onChange={e => setSetupConfig(p => ({...p, branches: e.target.value}))} placeholder="1" style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Logo URL (optional)</label>
                        <input className="input" value={setupConfig.logo} onChange={e => setSetupConfig(p => ({...p, logo: e.target.value}))} placeholder="https://yourlogo.com/logo.png" style={{ color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                  </div>
                )}
                {setupStep === 1 && (
                  <div>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>🌍 Region & Tax Configuration</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Country of Operation</label>
                        <select className="select" value={setupConfig.country} onChange={e => { const c = e.target.value; setSetupConfig(p => ({...p, country: c, currency: c === 'SA' ? 'SAR' : c === 'JO' ? 'JOD' : c === 'AE' ? 'AED' : 'USD', vatRate: c === 'SA' ? '15' : c === 'JO' ? '16' : c === 'AE' ? '5' : '0'})); }} style={{ color: 'var(--text-primary)' }}>
                          {[['SA', '🇸🇦 Saudi Arabia'], ['JO', '🇯🇴 Jordan'], ['AE', '🇦🇪 UAE'], ['KW', '🇰🇼 Kuwait'], ['BH', '🇧🇭 Bahrain'], ['OM', '🇴🇲 Oman'], ['QA', '🇶🇦 Qatar']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Currency</label>
                        <input className="input" value={setupConfig.currency} readOnly style={{ color: 'var(--text-primary)', background: 'var(--bg-card-hover)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">VAT/Tax Number</label>
                        <input className="input" value={setupConfig.vatNumber} onChange={e => setSetupConfig(p => ({...p, vatNumber: e.target.value}))} placeholder="e.g. 300458129" style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">VAT Rate (%)</label>
                        <input className="input" value={setupConfig.vatRate} onChange={e => setSetupConfig(p => ({...p, vatRate: e.target.value}))} placeholder="15" style={{ color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    <div className="ai-glow-panel" style={{ marginTop: '16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--ai-glow-color)', marginBottom: '6px' }}>ℹ️ Compliance Note</div>
                      {setupConfig.country === 'SA' && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Saudi Arabia: ZATCA Phase 2 e-invoicing is mandatory. CyShop will automatically handle UBL 2.1 XML generation, cryptographic signing, and portal submission.</p>}
                      {setupConfig.country === 'JO' && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Jordan: JoFawtara e-invoicing is mandatory under ISTD regulations. CyShop integrates with the Jordan Income and Sales Tax Department API at 16% VAT.</p>}
                      {!['SA', 'JO'].includes(setupConfig.country) && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Standard invoicing will be configured. Contact support to enable country-specific e-invoicing compliance.</p>}
                    </div>
                  </div>
                )}
                {setupStep === 2 && (
                  <div>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>🧩 Select Modules to Activate</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {[
                        { key: 'pos', label: 'POS & Cashier', icon: '🛒', desc: 'Retail and restaurant point of sale' },
                        { key: 'hr', label: 'HR & Payroll', icon: '👥', desc: 'Employee management and salaries' },
                        { key: 'accounting', label: 'Accounting', icon: '📒', desc: 'Double-entry bookkeeping & VAT' },
                        { key: 'inventory', label: 'Inventory & BOM', icon: '📦', desc: 'Stock control and Bill of Materials' },
                        { key: 'delivery', label: 'Delivery Integration', icon: '🛵', desc: 'Talabat & Careem channels' },
                        { key: 'kiosk', label: 'Kiosk & QR Menu', icon: '📱', desc: 'Self-service ordering' }
                      ].map(mod => (
                        <div key={mod.key} className="card" style={{ cursor: 'pointer', borderColor: setupConfig.modules[mod.key] ? 'var(--primary-color)' : 'var(--border-color)', background: setupConfig.modules[mod.key] ? 'var(--primary-glow)' : 'var(--bg-card)' }} onClick={() => setSetupConfig(p => ({...p, modules: {...p.modules, [mod.key]: !p.modules[mod.key]}}))}>
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>{mod.icon}</div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{mod.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{mod.desc}</div>
                          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '600', color: setupConfig.modules[mod.key] ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                            {setupConfig.modules[mod.key] ? '✅ Enabled' : '○ Disabled'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {setupStep === 3 && (
                  <div>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>👤 Administrator Account</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Admin Email *</label>
                        <input className="input" type="email" value={setupConfig.adminEmail} onChange={e => setSetupConfig(p => ({...p, adminEmail: e.target.value}))} placeholder="admin@yourbusiness.com" style={{ color: 'var(--text-primary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Admin Password *</label>
                        <input className="input" type="password" value={setupConfig.adminPassword} onChange={e => setSetupConfig(p => ({...p, adminPassword: e.target.value}))} placeholder="Min 8 characters" style={{ color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    <div className="ai-glow-panel" style={{ marginTop: '12px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--ai-glow-color)' }}>🔐 Security Note: </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>All passwords are stored with AES-256 encryption. Two-factor authentication is recommended post-setup.</span>
                    </div>
                  </div>
                )}
                {setupStep === 4 && (
                  <div>
                    <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>📋 Review & Launch</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      {[
                        ['Business Name', setupConfig.businessName || '(not set)'],
                        ['Business Type', setupConfig.businessType],
                        ['Country', setupConfig.country],
                        ['Currency', setupConfig.currency],
                        ['VAT Number', setupConfig.vatNumber || '(not set)'],
                        ['VAT Rate', setupConfig.vatRate + '%'],
                        ['Branches', setupConfig.branches],
                        ['Modules Active', Object.values(setupConfig.modules).filter(Boolean).length + ' / ' + Object.keys(setupConfig.modules).length],
                        ['Admin Email', setupConfig.adminEmail || '(not set)']
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: '8px', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ai-glow-panel" style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--ai-glow-color)', marginBottom: '6px' }}><Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> AI Configuration Check</div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>✅ Configuration validated. {setupConfig.country === 'SA' ? 'ZATCA e-invoicing will be automatically configured.' : setupConfig.country === 'JO' ? 'JoFawtara e-invoicing will be automatically configured.' : 'Standard invoicing ready.'} System is ready to launch.</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary" style={{ color: 'var(--text-primary)' }} disabled={setupStep === 0} onClick={() => setSetupStep(s => s - 1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => {
                    if (setupStep < 4) { setSetupStep(s => s + 1); }
                    else {
                      setSetupComplete(true);
                      if (setupConfig.country) setCountry(setupConfig.country.substring(0, 2));
                      if (setupConfig.businessName) setStoreName(setupConfig.businessName);
                      triggerToast('Setup complete! System configured successfully!', 'success');
                      confetti({ particleCount: 200, spread: 120 });
                    }
                  }}>{setupStep < 4 ? 'Next →' : '🚀 Launch ERP'}</button>
                </div>
              </div>
            )}
          </main>
        )}

      </div>

      <button className="ai-chat-trigger" onClick={() => setChatbotOpen(!chatbotOpen)} title="Chat with CYBERCOM AI">
        {chatbotOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* AI Assistant Chatbot Dialog Window */}
      {chatbotOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <span className="ai-chat-header-title">
              <Bot size={18} style={{ color: 'var(--ai-glow-color)' }} />
              <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CYBERCOM AI
              </span>
            </span>
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
              onClick={() => setChatbotOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`ai-msg ${msg.sender === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}
              >
                <div style={{ whiteSpace: 'pre-line', color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)' }}>{msg.text}</div>
                <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.75, color: msg.sender === 'user' ? '#ffffff' : 'var(--text-muted)' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}
            {chatTyping && (
              <div className="ai-typing-indicator">
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', overflowX: 'auto', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
              onClick={() => { setChatInput('Audit Talabat integration'); }}
            >
              🛵 Talabat Audit
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
              onClick={() => { setChatInput('Show low stock levels'); }}
            >
              📦 Stock Alerts
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px', color: 'var(--text-primary)' }}
              onClick={() => { setChatInput('Verify e-invoicing compliance settings'); }}
            >
              🇸🇦 VAT compliance
            </button>
          </div>

          <div className="ai-chat-input-area">
            <input
              type="text"
              placeholder="Ask AI assistant..."
              className="input"
              style={{ height: '36px', fontSize: '13px', color: 'var(--text-primary)' }}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <button className="btn btn-primary btn-icon" style={{ width: '36px', height: '36px', color: '#ffffff' }} onClick={handleSendMessage}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
