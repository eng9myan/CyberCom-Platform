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

      // Draw Neural Background Grid
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
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
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 80 + Math.sin(time) * 5, 80 + Math.cos(time) * 5, time * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 110 + Math.cos(time * 0.8) * 8, 50 + Math.sin(time * 0.8) * 4, -time * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsating Center Core
        const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 40 + Math.sin(time * 4) * 3);
        gradient.addColorStop(0, '#a78bfa');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 45 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Neural network connections
        ctx.fillStyle = '#22d3ee';
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3 + time * 0.2;
          const px = cx + Math.cos(angle) * (80 + Math.sin(time) * 5);
          const py = cy + Math.sin(angle) * (80 + Math.sin(time) * 5);
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
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
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [cart, setCart] = useState([]);
  const [posCategory, setPosCategory] = useState('All');

  // Inventory Management State
  const [inventory, setInventory] = useState(
    INITIAL_PRODUCTS.map((p, idx) => ({
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
  const [newProdCategory, setNewProdCategory] = useState('Coffee');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('50');

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

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // AI Chatbot State
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am CyShop AI Assistant. How can I help you analyze sales, monitor inventory levels, configure compliance, or audit the Talabat delivery channel?',
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
                const newOrder = {
                  id: `ORD-${orders.length + 101}`,
                  items: orderItems,
                  total: 9.50,
                  status: 'pending',
                  timestamp: new Date().toISOString(),
                  invoiceId: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
                  country: 'JO',
                  source: 'talabat',
                  deliveryInfo: {
                    riderName: 'Autonomous Nova Delivery Agent',
                    deliveryAddress: 'Jabal Amman, Home Office'
                  }
                };
                setOrders(prevOrders => [newOrder, ...prevOrders]);
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
      prepTime: '5 min'
    };

    setProducts((prev) => [...prev, newProduct]);
    setInventory((prev) => [...prev, { product: newProduct, stock: stockNum, minStock: 20 }]);

    setNewProdName('');
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
          <div className="sidebar-logo">CS</div>
          {!sidebarCollapsed && <span className="sidebar-logo-text" style={{ color: 'var(--text-primary)' }}>CyShop ERP</span>}
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

        <div className="sidebar-footer" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">AD</div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name" style={{ color: 'var(--text-primary)' }}>Admin Staff</span>
              <span className="user-role" style={{ color: 'var(--text-muted)' }}>Store Manager</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 style={{ textTransform: 'capitalize', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {activeTab === 'pos' ? 'POS Cashier Screen' : activeTab === 'kds' ? 'Kitchen Monitor (KDS)' : activeTab === 'shifts' ? 'Staff Shifts' : activeTab === 'customers' ? 'CRM & Loyalty' : activeTab}
            </h2>
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
                        <div className="product-image-placeholder">
                          {p.category === 'Coffee' && '☕'}
                          {p.category === 'Mains' && '🍔'}
                          {p.category === 'Desserts' && '🍰'}
                          {p.category === 'Drinks' && '🥤'}
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
                      placeholder="e.g. Cyber Donut"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="select"
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
                      placeholder="e.g. 50"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                    />
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

                <div>
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
                      
                      if (errors.length > 0) {
                        if (istdEnabled && (!jofotaraUsername || !jofotaraSecret)) setJofotaraConnected(false);
                        if (zatcaSandbox && (!zatcaClientId || !zatcaSecret)) setZatcaConnected(false);
                        if (careemEnabled && (!careemMerchantId || !careemApiKey)) setCareemConnected(false);
                        triggerToast(`Verification failed: Config missing for ${errors.join(', ')}`, 'error');
                      } else {
                        setJofotaraConnected(true);
                        setZatcaConnected(true);
                        setCareemConnected(true);
                        triggerToast('All compliance pipelines & delivery channels verified successfully!', 'success');
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
      </div>

      {/* Floating AI Assistant Chatbot Bubble Trigger */}
      <button className="ai-chat-trigger" onClick={() => setChatbotOpen(!chatbotOpen)} title="Chat with CyShop AI">
        {chatbotOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* AI Assistant Chatbot Dialog Window */}
      {chatbotOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <span className="ai-chat-header-title" style={{ color: 'var(--text-primary)' }}>
              <Bot size={18} style={{ color: 'var(--ai-glow-color)' }} /> CyShop AI Assistant
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
