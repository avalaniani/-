import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  LayoutDashboard, 
  Zap,
  Briefcase,
  Lock,
  ArrowRight, 
  Plus,
  X,
  Pencil,
  Trash2,
  UserPlus,
  Power,
  Ban,
  ClipboardList,
  StickyNote,
  LogOut,
  Key,
  Sparkles
} from 'lucide-react';
import { User, Task, UserRole, TaskType, TaskStatus } from './types';

// --- Mock Initial Data ---

const MOCK_USERS: User[] = [
  { 
      id: 'u1', 
      name: 'אלכס (מנכ״ל)', 
      role: 'SUPER_ADMIN', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 
      efficiencyScore: 100, 
      status: 'ONLINE', 
      personalNotes: '',
      username: 'admin',
      password: '123'
  },
  { 
      id: 'u2', 
      name: 'דני (פיתוח)', 
      role: 'EMPLOYEE', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dani', 
      efficiencyScore: 88, 
      status: 'ONLINE', 
      personalNotes: 'לזכור לבדוק את הלוגים של השרת בבוקר.\nלהכין קפה.',
      username: 'dani',
      password: '123'
  },
  { 
      id: 'u3', 
      name: 'מיכל (עיצוב)', 
      role: 'EMPLOYEE', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michal', 
      efficiencyScore: 94, 
      status: 'IDLE', 
      personalNotes: '',
      username: 'michal',
      password: '123'
  },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', assigneeId: 'u2', title: 'Code Review: Core Engine', type: 'LOCKED', status: 'COMPLETED', estimatedMinutes: 45, elapsedSeconds: 2600, waitSeconds: 0, priority: 1, startTimeConstraint: '09:00' },
  { id: 't2', assigneeId: 'u2', title: 'Implement WebSocket Gateway', type: 'FLOATING', status: 'IN_PROGRESS', estimatedMinutes: 120, elapsedSeconds: 3400, waitSeconds: 0, priority: 2 },
  { id: 't3', assigneeId: 'u2', title: 'Fix Auth Bug', type: 'FLOATING', status: 'PENDING', estimatedMinutes: 30, elapsedSeconds: 0, waitSeconds: 0, priority: 3 },
  { id: 't4', assigneeId: 'u3', title: 'Design Dashboard Mockups', type: 'FLOATING', status: 'PENDING', estimatedMinutes: 180, elapsedSeconds: 0, waitSeconds: 0, priority: 2 },
];

const BLOCKER_REASONS = [
    "ממתין לאישור לקוח",
    "ממתין לחומרים/קבצים",
    "ממתין לאישור מנהל",
    "תקלה טכנית/תשתית",
    "תלות במשימה אחרת"
];

// --- Helper Components ---

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  // Pastel Palette
  const styles = {
    PENDING: 'bg-slate-100 text-slate-500 border-slate-200',
    IN_PROGRESS: 'bg-sky-100 text-sky-600 border-sky-200 animate-pulse',
    PAUSED: 'bg-amber-50 text-amber-600 border-amber-100',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    BLOCKED: 'bg-rose-50 text-rose-500 border-rose-100'
  };
  
  const labels = {
    PENDING: 'ממתין',
    IN_PROGRESS: 'בעבודה',
    PAUSED: 'הפסקה',
    COMPLETED: 'הושלם',
    BLOCKED: 'תקוע'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status]} shadow-sm`}>
      {labels[status]}
    </span>
  );
};

const TaskTypeIcon = ({ type }: { type: TaskType }) => {
  if (type === 'URGENT') return <Zap className="w-4 h-4 text-rose-400 fill-rose-100" />;
  if (type === 'LOCKED') return <Lock className="w-4 h-4 text-slate-400" />;
  return <Briefcase className="w-4 h-4 text-sky-400" />;
};

// --- Modals ---

const LoginScreen = ({ 
    onLogin, 
    error 
}: { 
    onLogin: (u: string, p: string) => void, 
    error: string 
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100 p-4">
            {/* Abstract Shapes for background */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
            
            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white w-full max-w-md animate-fade-in-up relative z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-sky-400 to-indigo-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200 transform rotate-3">
                         <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">TaskFlow</h1>
                    <p className="text-slate-500 mt-2 font-light text-lg">
                        ניהול משימות ברוגע.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">שם משתמש</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-200 text-slate-700 outline-none transition-all placeholder:text-slate-300"
                            placeholder="הזמן שם משתמש..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">סיסמא</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-200 text-slate-700 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-500 text-sm rounded-2xl flex items-center gap-2 border border-rose-100">
                            <AlertTriangle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group mt-6"
                    >
                        <span>התחברות</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 mb-1">כניסת הדגמה מהירה</p>
                    <div className="flex gap-2 justify-center">
                         <span className="bg-sky-50 px-3 py-1 rounded-full text-xs text-sky-600 font-mono">admin / 123</span>
                         <span className="bg-pink-50 px-3 py-1 rounded-full text-xs text-pink-600 font-mono">dani / 123</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CredentialRow: React.FC<{ user: User, onUpdate: (id: string, name: string, score: number, username: string, password: string) => void }> = ({ user, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState(user.password);

    const handleSave = () => {
        onUpdate(user.id, user.name, user.efficiencyScore, username, password);
        setIsEditing(false);
    };

    return isEditing ? (
        <tr className="bg-sky-50 transition-colors">
            <td className="p-4 flex items-center gap-3">
                <img src={user.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt={user.name} />
                <span className="font-medium text-slate-700">{user.name}</span>
            </td>
            <td className="p-4 text-slate-500 text-sm">
                {user.role === 'SUPER_ADMIN' ? 'מנכ"ל' : 'עובד'}
            </td>
            <td className="p-4">
                <input 
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-200 outline-none font-mono text-sky-700"
                   autoFocus
                />
            </td>
            <td className="p-4">
                <input 
                   type="text"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-200 outline-none font-mono text-slate-700"
                />
            </td>
            <td className="p-4 flex gap-2 justify-end">
                <button onClick={handleSave} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-xl transition-colors shadow-sm" title="שמור">
                    <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-rose-100 text-rose-500 hover:bg-rose-200 rounded-xl transition-colors shadow-sm" title="ביטול">
                    <X className="w-4 h-4" />
                </button>
            </td>
        </tr>
    ) : (
        <tr className="hover:bg-slate-50 group transition-colors border-b border-slate-50 last:border-0">
            <td className="p-4 flex items-center gap-3">
                <img src={user.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt={user.name} />
                <span className="font-medium text-slate-700">{user.name}</span>
            </td>
            <td className="p-4 text-slate-500 text-sm">
                {user.role === 'SUPER_ADMIN' ? 'מנכ"ל' : 'עובד'}
            </td>
            <td className="p-4 font-mono text-sky-600 text-sm">{user.username}</td>
            <td className="p-4 font-mono text-slate-400 text-sm tracking-widest">
                ••••••
            </td>
            <td className="p-4 text-end">
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all" title="ערוך">
                    <Pencil className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

const CredentialsModal = ({ 
  isOpen, 
  onClose, 
  users,
  onUpdateUser
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  users: User[],
  onUpdateUser: (id: string, name: string, score: number, username: string, password: string) => void
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-3xl p-8 animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-500">
                  <Key className="w-6 h-6" />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">גישה והרשאות</h2>
                  <p className="text-sm text-slate-500">ניהול שמות משתמש וסיסמאות לצוות</p>
              </div>
          </div>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-2xl max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-right text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-medium sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="p-4 font-normal">עובד</th>
                        <th className="p-4 font-normal">תפקיד</th>
                        <th className="p-4 font-normal">שם משתמש</th>
                        <th className="p-4 font-normal">סיסמא</th>
                        <th className="p-4 w-20"></th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {users.map(u => (
                        <CredentialRow key={u.id} user={u} onUpdate={onUpdateUser} />
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const BlockerModal = ({
    isOpen,
    onClose,
    onConfirm
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (reason: string) => void
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-soft w-full max-w-sm p-8 animate-fade-in-up border border-white">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Ban className="w-8 h-8 text-rose-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">דיווח על חסם</h2>
                    <p className="text-slate-500 text-sm mt-1">מה מונע ממך להתקדם?</p>
                </div>

                <div className="space-y-3 mb-8">
                    {BLOCKER_REASONS.map((reason) => (
                        <button
                            key={reason}
                            onClick={() => { onConfirm(reason); onClose(); }}
                            className="w-full text-right px-5 py-3.5 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-sm font-medium text-slate-600 hover:text-rose-600"
                        >
                            {reason}
                        </button>
                    ))}
                </div>
                
                <button onClick={onClose} className="w-full py-3 text-slate-400 text-sm hover:text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                    ביטול
                </button>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  userName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void,
  userName: string
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-sm p-8 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">מחיקת עובד</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                האם אתה בטוח שברצונך למחוק את <strong>{userName}</strong>?
                <br />
                פעולה זו אינה הפיכה.
            </p>
            
            <div className="flex gap-4 w-full">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                    ביטול
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                >
                    מחק
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const UserCreationModal = ({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onCreate: (name: string, user: string, pass: string, role: UserRole) => void 
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) return;
    onCreate(name, username, password, role);
    setName('');
    setUsername('');
    setPassword('');
    setRole('EMPLOYEE');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-sm p-8 animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800">הוספת חבר צוות</h2>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">שם מלא</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-slate-300"
              placeholder="ישראל ישראלי"
              autoFocus
            />
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">תפקיד</label>
              <div className="flex gap-3 p-1.5 bg-slate-50 rounded-xl">
                  <button
                      type="button"
                      onClick={() => setRole('EMPLOYEE')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'EMPLOYEE' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      עובד
                  </button>
                  <button
                      type="button"
                      onClick={() => setRole('SUPER_ADMIN')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'SUPER_ADMIN' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      מנהל
                  </button>
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">שם משתמש</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">סיסמא</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              הוסף למערכת
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- User Edit Modal ---

const UserEditModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: User | null, 
  onSave: (id: string, name: string, score: number, username: string, password: string) => void 
}) => {
  const [name, setName] = useState('');
  const [score, setScore] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setScore(user.efficiencyScore);
      setUsername(user.username);
      setPassword(user.password);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, name, score, username, password);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-8 animate-fade-in-up">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Pencil className="w-5 h-5 text-sky-400" />
             עריכת פרטי עובד
          </h2>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Top Section: Avatar & Basic Info */}
          <div className="flex gap-5 items-center">
             <div className="shrink-0 relative">
                <div className="absolute inset-0 bg-sky-100 rounded-full blur-md opacity-50"></div>
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-2 border-white shadow-md relative z-10" />
             </div>
             <div className="flex-1 space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">שם מלא</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border-b border-slate-200 focus:border-sky-400 bg-transparent outline-none text-slate-700 font-medium transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">יעילות (0-100)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full px-3 py-2 border-b border-slate-200 focus:border-sky-400 bg-transparent outline-none text-slate-700 font-medium transition-colors"
                    />
                </div>
             </div>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          {/* Bottom Section: Credentials Grid */}
          <div className="bg-slate-50/80 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">פרטי התחברות</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">שם משתמש</label>
                    <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-sky-200 outline-none font-mono text-slate-600"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">סיסמא</label>
                    <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-sky-200 outline-none font-mono text-slate-600"
                    />
                </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm border border-slate-100"
            >
              ביטול
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-sky-500 text-white rounded-2xl text-sm font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-200"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskEditModal = ({
  isOpen,
  onClose,
  task,
  onSave
}: {
  isOpen: boolean,
  onClose: () => void,
  task: Task | null,
  onSave: (taskId: string, updates: Partial<Task>) => void
}) => {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [priority, setPriority] = useState(2);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setEstimatedMinutes(task.estimatedMinutes);
      setPriority(task.priority);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, { title, estimatedMinutes, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-8 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">עריכת משימה</h2>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">שם המשימה</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">זמן (דקות)</label>
              <input 
                type="number" 
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">עדיפות</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700"
              >
                <option value={1}>גבוהה</option>
                <option value={2}>בינונית</option>
                <option value={3}>נמוכה</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
            >
                ביטול
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskDeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  taskTitle
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void,
  taskTitle: string
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-sm p-8 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">מחיקת משימה</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                האם למחוק את המשימה:
                <br />
                <strong>{taskTitle}</strong>?
            </p>
            
            <div className="flex gap-4 w-full">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                    ביטול
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                >
                    מחק
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const AdminPersonalWorkspace = ({
  isOpen,
  onClose,
  user,
  tasks,
  onAddTask,
  onUpdateNotes,
  onEditTask,
  onDeleteTask
}: {
  isOpen: boolean,
  onClose: () => void,
  user: User,
  tasks: Task[],
  onAddTask: () => void,
  onUpdateNotes: (notes: string) => void,
  onEditTask: (taskId: string, updates: Partial<Task>) => void,
  onDeleteTask: (taskId: string) => void
}) => {
  const [tab, setTab] = useState<'TASKS' | 'NOTES'>('TASKS');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <TaskEditModal 
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={onEditTask}
      />
      
      <TaskDeleteConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => taskToDelete && onDeleteTask(taskToDelete.id)}
        taskTitle={taskToDelete?.title || ''}
      />
      
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-lg p-8 animate-fade-in-up h-[600px] flex flex-col">
         {/* Header */}
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="bg-sky-100 p-2 rounded-xl text-sky-600">
                    <Briefcase className="w-5 h-5" />
                </div>
                המרחב האישי
            </h2>
            <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
            </button>
         </div>

         {/* Tabs */}
         <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl mb-6 shrink-0">
              <button 
                  onClick={() => setTab('TASKS')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'TASKS' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <LayoutDashboard className="w-4 h-4" />
                  משימות
              </button>
              <button 
                  onClick={() => setTab('NOTES')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'NOTES' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <StickyNote className="w-4 h-4" />
                  מחברת
              </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {tab === 'TASKS' ? (
                <div className="space-y-4">
                   <button 
                     onClick={onAddTask}
                     className="w-full py-4 border border-dashed border-sky-200 text-sky-600 rounded-2xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 font-bold mb-4"
                   >
                     <Plus className="w-5 h-5" />
                     משימה אישית חדשה
                   </button>

                   {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center mt-10 text-slate-300">
                         <Sparkles className="w-10 h-10 mb-2" />
                         <p>הכל נקי</p>
                      </div>
                   ) : (
                      tasks.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-sky-200 transition-all hover:shadow-md">
                            <div>
                                <div className="font-bold text-slate-800 text-sm mb-1">{t.title}</div>
                                <div className="text-xs text-slate-500 font-medium">{t.estimatedMinutes} דקות • <span className={t.status === 'COMPLETED' ? 'text-emerald-500' : 'text-sky-500'}>{t.status}</span></div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setEditingTask(t); 
                                    }} 
                                    className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors" 
                                    title="ערוך"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setTaskToDelete(t);
                                    }} 
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" 
                                    title="מחק"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                      ))
                   )}
                </div>
             ) : (
                <div className="h-full flex flex-col">
                    <textarea
                        className="flex-1 w-full p-6 bg-amber-50/50 border border-amber-100 rounded-2xl resize-none focus:ring-2 focus:ring-amber-200 focus:border-transparent outline-none text-slate-700 leading-relaxed shadow-inner"
                        placeholder="מה על ליבך?"
                        value={user.personalNotes || ''}
                        onChange={(e) => onUpdateNotes(e.target.value)}
                    />
                </div>
             )}
          </div>
      </div>
    </div>
  )
}

// --- Task Creation Modal ---

const TaskCreationModal = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  assigneeId, 
  currentUserRole 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onCreate: (task: Partial<Task>) => void, 
  assigneeId: string | null,
  currentUserRole: UserRole
}) => {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [type, setType] = useState<TaskType>('FLOATING');
  const [priority, setPriority] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onCreate({
      title,
      estimatedMinutes,
      type,
      priority,
      assigneeId: assigneeId || ''
    });
    
    setTitle('');
    setEstimatedMinutes(60);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-8 animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800">
            {currentUserRole === 'SUPER_ADMIN' ? 'משימה חדשה לצוות' : 'משימה אישית חדשה'}
          </h2>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">שם המשימה</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700"
              placeholder="מה התוכנית?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">זמן (דקות)</label>
              <input 
                type="number" 
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">עדיפות</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-200 outline-none text-slate-700"
              >
                <option value={1}>גבוהה</option>
                <option value={2}>בינונית</option>
                <option value={3}>נמוכה</option>
              </select>
            </div>
          </div>

          {currentUserRole === 'SUPER_ADMIN' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">סוג</label>
              <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl">
                 {(['FLOATING', 'LOCKED', 'URGENT'] as TaskType[]).map(t => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => setType(t)}
                     className={`flex-1 text-xs py-2.5 rounded-lg transition-all ${type === t ? 'bg-white shadow-sm text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {t === 'FLOATING' ? 'שוטפת' : t === 'LOCKED' ? 'נעולה' : 'דחופה'}
                   </button>
                 ))}
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
            >
              צור משימה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- History Modal (Completed Tasks) ---
const TaskHistoryModal = ({ 
    isOpen, 
    onClose, 
    user, 
    tasks,
    onEditTask,
    onDeleteTask
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    user: User | null, 
    tasks: Task[],
    onEditTask: (taskId: string, updates: Partial<Task>) => void,
    onDeleteTask: (taskId: string) => void
}) => {
    const [tab, setTab] = useState<'OPEN' | 'HISTORY'>('OPEN');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    if (!isOpen || !user) return null;

    const completedTasks = tasks.filter(t => t.assigneeId === user.id && t.status === 'COMPLETED').sort((a,b) => b.id.localeCompare(a.id));
    const openTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== 'COMPLETED').sort((a,b) => a.priority - b.priority);
    
    const totalTime = completedTasks.reduce((acc, t) => acc + t.elapsedSeconds, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
             <TaskEditModal 
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                task={editingTask}
                onSave={onEditTask}
            />

            <TaskDeleteConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={() => taskToDelete && onDeleteTask(taskToDelete.id)}
                taskTitle={taskToDelete?.title || ''}
            />

            <div className="bg-white rounded-3xl shadow-soft w-full max-w-3xl p-8 animate-fade-in-up h-[700px] flex flex-col">
                 <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">תיק משימות</h2>
                            <p className="text-slate-500 text-sm">עבור: <span className="font-medium text-slate-700">{user.name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl mb-6 shrink-0">
                    <button 
                        onClick={() => setTab('OPEN')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'OPEN' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        פתוחות ({openTasks.length})
                    </button>
                    <button 
                        onClick={() => setTab('HISTORY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'HISTORY' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        היסטוריה ({completedTasks.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {tab === 'OPEN' ? (
                        openTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                                <p>אין משימות פתוחות - נקי לחלוטין!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {openTasks.map(task => (
                                    <div key={task.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${task.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-600' : task.status === 'BLOCKED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                                                {task.status === 'IN_PROGRESS' ? <Clock className="w-5 h-5 animate-pulse" /> : task.status === 'BLOCKED' ? <Ban className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-slate-700">{task.title}</h3>
                                                    <StatusBadge status={task.status} />
                                                </div>
                                                <div className="text-xs text-slate-400 flex gap-3 font-medium">
                                                    <span className="flex items-center gap-1"><TaskTypeIcon type={task.type}/> {task.estimatedMinutes} דק'</span>
                                                    {task.elapsedSeconds > 0 && <span className="font-mono text-sky-500">בפועל: {formatTime(task.elapsedSeconds)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingTask(task)} className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors" title="ערוך">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setTaskToDelete(task)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="מחק">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // HISTORY TAB
                        completedTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
                                <p>אין משימות שהושלמו עדיין</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {completedTasks.map(task => {
                                    const estimatedSec = task.estimatedMinutes * 60;
                                    const varianceSec = task.elapsedSeconds - estimatedSec;
                                    const variancePercent = Math.round((varianceSec / estimatedSec) * 100);
                                    const isOvertime = varianceSec > 0;
                                    
                                    return (
                                        <div key={task.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{task.type === 'URGENT' ? 'דחוף' : task.type === 'LOCKED' ? 'נעול' : 'רגיל'}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-700">{task.title}</h3>
                                            </div>
                                            
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-center">
                                                    <div className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wide">בפועל</div>
                                                    <div className="font-mono font-medium text-slate-600">{formatTime(task.elapsedSeconds)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wide">תכנון</div>
                                                    <div className="font-mono text-slate-400">{task.estimatedMinutes}</div>
                                                </div>
                                                <div className="w-16 text-center">
                                                    <div className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wide">חריגה</div>
                                                    <div className={`font-bold ${isOvertime ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {isOvertime ? '+' : ''}{variancePercent}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-sm shrink-0 bg-slate-50/50 p-4 rounded-2xl">
                    <span className="text-slate-500 font-medium">סה"כ זמן עבודה:</span>
                    <span className="font-mono font-bold text-sky-600 text-lg">{formatTime(totalTime)}</span>
                </div>
            </div>
        </div>
    );
}

// --- Efficiency Reports Modal ---

const EfficiencyReportsModal = ({ isOpen, onClose, users, tasks }: { isOpen: boolean, onClose: () => void, users: User[], tasks: Task[] }) => {
  if (!isOpen) return null;

  const employees = users.filter(u => u.role !== 'SUPER_ADMIN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-5xl p-8 animate-fade-in-up h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="bg-violet-100 p-2 rounded-xl text-violet-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              דוח יעילות יומי
            </h2>
          </div>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto rounded-2xl border border-slate-100">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wide sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="p-5">עובד</th>
                <th className="p-5">משימות</th>
                <th className="p-5">נטו עבודה</th>
                <th className="p-5 text-rose-400">בזבוז (המתנה)</th>
                <th className="p-5">חריגה ממוצעת</th>
                <th className="p-5">ציון</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {employees.map(emp => {
                const empTasks = tasks.filter(t => t.assigneeId === emp.id);
                const completed = empTasks.filter(t => t.status === 'COMPLETED');
                
                const totalSeconds = empTasks.reduce((acc, t) => acc + t.elapsedSeconds, 0);
                const totalWaitSeconds = empTasks.reduce((acc, t) => acc + (t.waitSeconds || 0), 0);
                
                const startedTasks = empTasks.filter(t => t.elapsedSeconds > 0);
                let avgVariance = 0;
                if (startedTasks.length > 0) {
                   const totalVariance = startedTasks.reduce((acc, t) => {
                     const estimatedSec = t.estimatedMinutes * 60;
                     return acc + ((t.elapsedSeconds - estimatedSec) / estimatedSec);
                   }, 0);
                   avgVariance = totalVariance / startedTasks.length;
                }

                const variancePercent = Math.round(avgVariance * 100);
                const varianceColor = variancePercent > 10 ? 'text-rose-500 font-bold' : variancePercent < -10 ? 'text-emerald-500 font-bold' : 'text-slate-500';

                return (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-sky-50/30 transition-colors">
                    <td className="p-5 flex items-center gap-4">
                      <img src={emp.avatar} className="w-10 h-10 rounded-full border border-white shadow-sm" alt={emp.name} />
                      <span className="font-bold text-slate-700">{emp.name}</span>
                    </td>
                    <td className="p-5"><span className="font-bold">{completed.length}</span> <span className="text-slate-400">/ {empTasks.length}</span></td>
                    <td className="p-5 font-mono text-sm text-sky-600 font-medium">{formatTime(totalSeconds)}</td>
                    <td className="p-5 font-mono text-sm text-rose-500 font-medium">{formatTime(totalWaitSeconds)}</td>
                    <td className={`p-5 ${varianceColor} text-sm`}>
                      {variancePercent > 0 ? `+${variancePercent}%` : `${variancePercent}%`}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                         <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${emp.efficiencyScore >= 90 ? 'bg-emerald-400' : emp.efficiencyScore >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${emp.efficiencyScore}%` }}></div>
                         </div>
                         <span className="font-bold text-slate-700">{emp.efficiencyScore}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EmployeeCockpit = ({ 
    user, 
    tasks, 
    onToggle, 
    onComplete,
    onAddTask,
    onBlock,
    onUpdateNotes
}: { 
    user: User, 
    tasks: Task[], 
    onToggle: (id: string) => void, 
    onComplete: (id: string) => void,
    onAddTask: () => void,
    onBlock: (id: string, reason: string) => void,
    onUpdateNotes: (notes: string) => void
}) => {
    const [blockModalTaskId, setBlockModalTaskId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'TASKS' | 'NOTES'>('TASKS');

    const activeTask = tasks.find(t => t.status === 'IN_PROGRESS');
    const pendingTasks = tasks.filter(t => ['PENDING', 'PAUSED', 'BLOCKED'].includes(t.status)).sort((a, b) => a.priority - b.priority);
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

    return (
        <div className="flex flex-col lg:flex-row h-full bg-[#f8fafc] overflow-hidden">
            <BlockerModal 
                isOpen={!!blockModalTaskId} 
                onClose={() => setBlockModalTaskId(null)} 
                onConfirm={(reason) => blockModalTaskId && onBlock(blockModalTaskId, reason)} 
            />

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden bg-white/80 backdrop-blur border-b border-slate-100 p-3 flex gap-3 shrink-0 shadow-sm z-20">
                <button
                    onClick={() => setMobileTab('TASKS')}
                    className={`flex-1 py-3 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${mobileTab === 'TASKS' ? 'bg-sky-50 text-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    משימות
                </button>
                <button
                    onClick={() => setMobileTab('NOTES')}
                    className={`flex-1 py-3 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${mobileTab === 'NOTES' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <StickyNote className="w-4 h-4" />
                    פנקס
                </button>
            </div>

            {/* Left Panel: Task List & Active Task */}
            <div className={`flex-1 flex-col p-6 lg:p-10 overflow-hidden gap-8 ${mobileTab === 'TASKS' ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">היי, {user.name.split(' ')[0]} 👋</h1>
                    <p className="text-slate-500 font-medium">יש לך <span className="text-sky-500 font-bold">{pendingTasks.length}</span> משימות להיום.</p>
                </div>

                {/* Active Task Hero Section */}
                <div className="bg-white/80 backdrop-blur rounded-[2rem] shadow-soft border border-white p-8 flex flex-col md:flex-row gap-8 items-center justify-between transition-all hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                     {/* Gentle gradient background accent */}
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-sky-400 to-pink-400"></div>
                    
                    {activeTask ? (
                        <>
                            <div className="flex-1 w-full z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        עובד עכשיו
                                    </span>
                                    <TaskTypeIcon type={activeTask.type} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-2 leading-tight">{activeTask.title}</h2>
                                <p className="text-slate-400 text-sm font-medium">התחיל לפני: <span className="font-mono text-slate-500">{formatTime(activeTask.elapsedSeconds)}</span></p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto z-10">
                                <div className="text-center px-6 border-r border-slate-100 w-full sm:w-auto flex justify-between sm:block items-center">
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 hidden sm:block">זמן מצטבר</div>
                                    <div className="text-4xl font-mono font-bold text-sky-500 drop-shadow-sm">{formatTime(activeTask.elapsedSeconds)}</div>
                                </div>
                                <div className="flex flex-col gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => onToggle(activeTask.id)}
                                        className="px-8 py-3 bg-amber-100 text-amber-700 font-bold rounded-2xl hover:bg-amber-200 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                                    >
                                        <Pause className="w-4 h-4" />
                                        השהה
                                    </button>
                                    <button 
                                        onClick={() => onComplete(activeTask.id)}
                                        className="px-8 py-3 bg-emerald-400 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-emerald-100"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        סיים משימה
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setBlockModalTaskId(activeTask.id)}
                                    className="p-4 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all w-full sm:w-auto flex justify-center border border-transparent hover:border-rose-100"
                                    title="דווח על חסימה"
                                >
                                    <Ban className="w-6 h-6" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full py-12 text-center text-slate-400 flex flex-col items-center z-10">
                            <div className="bg-slate-50 p-6 rounded-full mb-4 shadow-inner">
                                <Play className="w-10 h-10 text-slate-300 ml-1" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-1">אין משימה פעילה</h3>
                            <p className="text-sm text-slate-400">בחר משימה מהרשימה למטה כדי להתחיל לעבוד</p>
                        </div>
                    )}
                </div>

                {/* Queue */}
                <div className="flex-1 bg-white/60 backdrop-blur rounded-[2rem] shadow-soft border border-white overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/40">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                            <ClipboardList className="w-5 h-5 text-sky-400" />
                            התור שלי
                        </h3>
                        <button onClick={onAddTask} className="text-xs bg-sky-50 text-sky-600 px-4 py-2 rounded-xl hover:bg-sky-100 transition-colors font-bold flex items-center gap-1.5 border border-sky-100">
                            <Plus className="w-3.5 h-3.5" />
                            משימה אישית
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
                        {pendingTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Sparkles className="w-12 h-12 mb-3 opacity-40" />
                                <p>הכל נקי! אין משימות ממתינות.</p>
                            </div>
                        ) : (
                            pendingTasks.map(task => (
                                <div key={task.id} className={`p-5 rounded-3xl border transition-all hover:shadow-lg hover:translate-y-[-2px] flex items-center justify-between group bg-white ${task.status === 'BLOCKED' ? 'border-rose-200 shadow-rose-50' : 'border-slate-100 shadow-sm'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${task.status === 'BLOCKED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                                            {task.status === 'BLOCKED' ? <Ban className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-bold text-lg ${task.status === 'BLOCKED' ? 'text-slate-800' : 'text-slate-700'}`}>{task.title}</h4>
                                                <TaskTypeIcon type={task.type} />
                                                {task.priority === 1 && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">דחוף</span>}
                                            </div>
                                            <div className="text-xs text-slate-400 flex gap-3 font-medium">
                                                <span>⏱️ {task.estimatedMinutes} דק'</span>
                                                {task.status === 'BLOCKED' && <span className="text-rose-500 font-bold">• חסום: {task.blockedReason}</span>}
                                                {task.status === 'PAUSED' && task.elapsedSeconds > 0 && <span className="text-amber-500 font-bold">• {formatTime(task.elapsedSeconds)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => onToggle(task.id)}
                                        disabled={!!activeTask}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!!activeTask ? 'opacity-0 group-hover:opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'opacity-0 group-hover:opacity-100 bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-200'}`}
                                    >
                                        {task.elapsedSeconds > 0 ? 'המשך' : 'התחל'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Notes & Stats */}
            <div className={`lg:w-96 bg-white/80 backdrop-blur border-r border-slate-100 p-8 flex-col gap-8 shadow-[5px_0_30px_rgba(0,0,0,0.02)] z-10 ${mobileTab === 'NOTES' ? 'flex w-full' : 'hidden lg:flex'}`}>
                <div className="flex-1 flex flex-col">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                             <StickyNote className="w-4 h-4" />
                        </div>
                        פנקס רשימות
                     </h3>
                     <textarea 
                        className="flex-1 w-full bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-700 text-sm leading-relaxed shadow-inner"
                        placeholder="רעיונות, משימות קטנות, תזכורות..."
                        value={user.personalNotes || ''}
                        onChange={(e) => onUpdateNotes(e.target.value)}
                     />
                </div>
                
                <div className="h-px bg-slate-100 w-full"></div>

                <div>
                    <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                        <BarChart3 className="w-5 h-5 text-sky-400" />
                        היום שלי
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex justify-between items-center">
                            <div className="text-slate-400 font-bold text-xs uppercase tracking-wider">משימות שהושלמו</div>
                            <div className="text-3xl font-black text-slate-800">{completedTasks.length}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- View: Admin Dashboard (Command Center) ---

const AdminDashboard = ({ 
  users, 
  tasks, 
  currentUser,
  onCreateUrgent,
  onAddTask,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onToggleStatus,
  onUpdateNotes,
  onEditTask,
  onDeleteTask
}: { 
  users: User[], 
  tasks: Task[], 
  currentUser: User,
  onCreateUrgent: (uid: string) => void,
  onAddTask: (uid: string) => void,
  onUpdateUser: (id: string, name: string, score: number, username: string, password: string) => void,
  onAddUser: (name: string, u: string, p: string, role: UserRole) => void,
  onDeleteUser: (id: string) => void,
  onToggleStatus: (id: string) => void,
  onUpdateNotes: (notes: string) => void,
  onEditTask: (taskId: string, updates: Partial<Task>) => void,
  onDeleteTask: (taskId: string) => void
}) => {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userForHistory, setUserForHistory] = useState<User | null>(null);
  const [isPersonalWorkspaceOpen, setIsPersonalWorkspaceOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const employees = users.filter(u => u.role !== 'SUPER_ADMIN');
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);

  return (
    <div className="p-10 h-full overflow-y-auto bg-slate-50/50">
        <CredentialsModal
            isOpen={isCredentialsOpen}
            onClose={() => setIsCredentialsOpen(false)}
            users={users}
            onUpdateUser={onUpdateUser}
        />
        
        <EfficiencyReportsModal 
            isOpen={isReportsOpen} 
            onClose={() => setIsReportsOpen(false)} 
            users={users} 
            tasks={tasks} 
        />

        <TaskHistoryModal 
            isOpen={!!userForHistory} 
            onClose={() => setUserForHistory(null)} 
            user={userForHistory} 
            tasks={tasks}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
        />

        <UserEditModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            user={editingUser}
            onSave={onUpdateUser}
        />
        
        <UserCreationModal
            isOpen={isAddUserOpen}
            onClose={() => setIsAddUserOpen(false)}
            onCreate={onAddUser}
        />

        <DeleteConfirmationModal
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            onConfirm={() => userToDelete && onDeleteUser(userToDelete.id)}
            userName={userToDelete?.name || ''}
        />

        <AdminPersonalWorkspace
            isOpen={isPersonalWorkspaceOpen}
            onClose={() => setIsPersonalWorkspaceOpen(false)}
            user={currentUser}
            tasks={myTasks}
            onAddTask={() => {
                onAddTask(currentUser.id);
            }}
            onUpdateNotes={onUpdateNotes}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
        />
        
        <div className="mb-10 flex items-end justify-between">
            <div>
                <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">מרכז שליטה</h1>
                <p className="text-slate-500 text-lg font-light">תמונת מצב בזמן אמת</p>
            </div>
            <div className="flex gap-4">
                 <button 
                  onClick={() => setIsPersonalWorkspaceOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-700 text-sm font-bold transition-all hover:-translate-y-1"
                >
                    <StickyNote className="w-4 h-4" />
                    המרחב שלי
                </button>
                <div className="w-px h-10 bg-slate-200 mx-2"></div>
                <button 
                  onClick={() => setIsCredentialsOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 text-sm font-bold transition-all"
                >
                    <Key className="w-4 h-4 text-amber-500" />
                    סיסמאות
                </button>
                <button 
                  onClick={() => setIsAddUserOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 text-sm font-bold transition-all"
                >
                    <UserPlus className="w-4 h-4 text-sky-500" />
                    הוסף עובד
                </button>
                <button 
                  onClick={() => setIsReportsOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 text-sm font-bold transition-all"
                >
                    <BarChart3 className="w-4 h-4 text-violet-500" />
                    דוחות יעילות
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employees.map(emp => {
                const empTasks = tasks.filter(t => t.assigneeId === emp.id);
                const inProgressTask = empTasks.find(t => t.status === 'IN_PROGRESS');
                const blockedTask = empTasks.find(t => t.status === 'BLOCKED');
                const activeTask = inProgressTask || blockedTask;
                const backgroundBlockedTasks = empTasks.filter(t => t.status === 'BLOCKED' && t.id !== activeTask?.id);
                const lastCompleted = empTasks.filter(t => t.status === 'COMPLETED').pop();
                const isSuspended = emp.status === 'OFFLINE';
                const isBlocked = activeTask?.status === 'BLOCKED';

                return (
                    <div key={emp.id} className={`bg-white rounded-[2rem] shadow-soft border border-white overflow-hidden flex flex-col group/card transition-all hover:translate-y-[-4px] hover:shadow-xl ${isSuspended ? 'opacity-60 grayscale' : ''} ${isBlocked ? 'ring-2 ring-rose-200' : ''}`}>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white relative">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-sky-100 rounded-full blur opacity-40"></div>
                                    <img src={emp.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm relative z-10" alt={emp.name} />
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white z-20 ${isBlocked ? 'bg-rose-500' : emp.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                                        <div className="flex opacity-0 group-hover/card:opacity-100 transition-opacity gap-1">
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setEditingUser(emp); }}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-sky-500 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onToggleStatus(emp.id); }}
                                                className={`p-1.5 hover:bg-slate-50 rounded-lg transition-colors ${isSuspended ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-amber-500'}`}
                                            >
                                                <Power className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.stopPropagation();
                                                    setUserToDelete(emp);
                                                }}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">ציון יעילות: <span className={emp.efficiencyScore > 90 ? 'text-emerald-500' : 'text-amber-500'}>{emp.efficiencyScore}</span></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onAddTask(emp.id)}
                                    title="הקצה משימה"
                                    disabled={isSuspended}
                                    className="p-3 bg-sky-50 text-sky-600 rounded-2xl hover:bg-sky-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Current Status Body */}
                        <div className="p-6 flex-1 bg-slate-50/30">
                            {isSuspended ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                                    <div className="flex flex-col items-center gap-2">
                                        <Power className="w-6 h-6 opacity-50" />
                                        <span>בהשהיה</span>
                                    </div>
                                </div>
                            ) : (
                            <>
                            <div className="mb-5">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">בטיפול כרגע</div>
                                {activeTask ? (
                                    <div className={`${isBlocked ? 'bg-rose-50 border-rose-100' : 'bg-white border-sky-100'} border rounded-2xl p-5 relative overflow-hidden shadow-sm`}>
                                        <div className="flex items-start justify-between mb-3 z-10 relative">
                                            <h4 className={`font-bold ${isBlocked ? 'text-rose-800' : 'text-slate-800'} text-base line-clamp-1`}>{activeTask.title}</h4>
                                            <span className={`animate-pulse ${isBlocked ? 'text-rose-400' : 'text-sky-400'}`}>
                                                {isBlocked ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </span>
                                        </div>
                                        <div className={`text-3xl font-mono ${isBlocked ? 'text-rose-600' : 'text-sky-600'} font-bold tracking-tight z-10 relative`}>
                                            {isBlocked ? formatTime(activeTask.waitSeconds || 0) : formatTime(activeTask.elapsedSeconds)}
                                        </div>
                                        <div className={`text-xs ${isBlocked ? 'text-rose-400 font-bold' : 'text-slate-400'} mt-2 z-10 relative`}>
                                            {isBlocked ? `חסם: ${activeTask.blockedReason}` : `צפי: ${activeTask.estimatedMinutes} דק'`}
                                        </div>
                                        {/* Soft Progress Bar */}
                                        <div className={`absolute bottom-0 left-0 h-1.5 ${isBlocked ? 'bg-rose-100' : 'bg-slate-100'} w-full`}>
                                            <div 
                                                className={`h-full rounded-r-full ${isBlocked ? 'bg-rose-400' : activeTask.elapsedSeconds > activeTask.estimatedMinutes * 60 ? 'bg-rose-400' : 'bg-sky-400'}`} 
                                                style={{ width: isBlocked ? '100%' : `${Math.min(100, (activeTask.elapsedSeconds / (activeTask.estimatedMinutes * 60)) * 100)}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl p-6 text-center text-slate-400 text-sm">
                                        פנוי למשימות
                                    </div>
                                )}
                            </div>

                            {backgroundBlockedTasks.length > 0 && (
                                <div className="mb-5">
                                     <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-2">
                                        <div className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>חסימות ברקע ({backgroundBlockedTasks.length})</span>
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                        {backgroundBlockedTasks.map(t => (
                                            <div key={t.id} className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex justify-between items-center">
                                                <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-rose-900 truncate" title={t.title}>{t.title}</span>
                                                    <span className="text-[10px] text-rose-500 truncate" title={t.blockedReason}>{t.blockedReason}</span>
                                                </div>
                                                <span className="font-mono text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded shadow-sm border border-rose-100 ml-2">
                                                    {formatTime(t.waitSeconds)}
                                                </span>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            )}

                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">הבא בתור</div>
                                <div className="space-y-2">
                                    {empTasks.filter(t => t.status === 'PENDING').slice(0, 3).map(t => (
                                        <div key={t.id} className="flex items-center justify-between text-sm p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3 truncate">
                                                <TaskTypeIcon type={t.type} />
                                                <span className="truncate max-w-[120px] text-slate-600 font-medium">{t.title}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md font-mono">{t.estimatedMinutes} דק'</span>
                                        </div>
                                    ))}
                                    {empTasks.filter(t => t.status === 'PENDING').length === 0 && <span className="text-xs text-slate-300 italic block text-center py-2">אין משימות ממתינות</span>}
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); setUserForHistory(emp); }}
                                className="w-full mt-6 py-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm font-bold"
                            >
                                <ClipboardList className="w-4 h-4 text-sky-500" />
                                צפה בכל המשימות
                            </button>
                            </>
                            )}
                        </div>
                        
                        {/* Footer Stats */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between text-xs text-slate-400 font-medium">
                             <span>הושלמו היום: {empTasks.filter(t => t.status === 'COMPLETED').length}</span>
                             {lastCompleted && <span>אחרונה: {lastCompleted.title.substring(0, 15)}...</span>}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
};

export default function App() {
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState('');
    
    // Timer Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setTasks(prevTasks => prevTasks.map(task => {
                if (task.status === 'IN_PROGRESS') {
                    return { ...task, elapsedSeconds: task.elapsedSeconds + 1 };
                }
                if (task.status === 'BLOCKED') {
                    return { ...task, waitSeconds: (task.waitSeconds || 0) + 1 };
                }
                return task;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handlers

    const handleLogin = (u: string, p: string) => {
        const user = users.find(user => user.username === u && user.password === p);
        if (user) {
            setCurrentUser(user);
            setLoginError('');
        } else {
            setLoginError('שם משתמש או סיסמא שגויים');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setLoginError('');
    };

    // Task Actions
    const handleAddTask = (task: Partial<Task>) => {
        const newTask: Task = {
            id: `t${Date.now()}`,
            assigneeId: task.assigneeId || (currentUser?.id || ''),
            title: task.title || 'משימה חדשה',
            type: task.type || 'FLOATING',
            status: 'PENDING',
            estimatedMinutes: task.estimatedMinutes || 60,
            elapsedSeconds: 0,
            waitSeconds: 0,
            priority: task.priority || 2,
            ...task
        };
        setTasks(prev => [...prev, newTask]);
    };

    const handleToggleTask = (taskId: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === taskId);
            if (!task) return prev;
            
            if (task.status === 'IN_PROGRESS') {
                return prev.map(t => t.id === taskId ? { ...t, status: 'PAUSED' } : t);
            } else if (['PENDING', 'PAUSED'].includes(task.status)) {
                 // Pause other running tasks for this user
                 return prev.map(t => {
                     if (t.id === taskId) return { ...t, status: 'IN_PROGRESS' };
                     if (t.assigneeId === task.assigneeId && t.status === 'IN_PROGRESS') return { ...t, status: 'PAUSED' };
                     return t;
                 });
            }
            return prev;
        });
    };

    const handleCompleteTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
    };

    const handleBlockTask = (taskId: string, reason: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'BLOCKED', blockedReason: reason } : t));
    };
    
    // Admin Actions
    const handleCreateUrgentTask = (userId: string) => {
        const newTask: Task = {
            id: `t${Date.now()}`,
            assigneeId: userId,
            title: 'משימה דחופה',
            type: 'URGENT',
            status: 'PENDING',
            estimatedMinutes: 30,
            elapsedSeconds: 0,
            waitSeconds: 0,
            priority: 1
        };
        setTasks(prev => [...prev, newTask]);
    };

    const handleUpdateUser = (id: string, name: string, score: number, username: string, password: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, name, efficiencyScore: score, username, password } : u));
    };

    const handleAddUser = (name: string, username: string, pass: string, role: UserRole) => {
        const newUser: User = {
            id: `u${Date.now()}`,
            name,
            username,
            password: pass,
            role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            efficiencyScore: 100,
            status: 'OFFLINE'
        };
        setUsers(prev => [...prev, newUser]);
    };

    const handleDeleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        // Also remove tasks for this user?
        setTasks(prev => prev.filter(t => t.assigneeId !== id)); 
    };

    const handleToggleUserStatus = (id: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id === id) {
                return { ...u, status: u.status === 'OFFLINE' ? 'ONLINE' : 'OFFLINE' };
            }
            return u;
        }));
    };
    
    const handleUpdateNotes = (notes: string) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, personalNotes: notes };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    };

    const handleEditTask = (taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Modal state for task creation
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskModalAssignee, setTaskModalAssignee] = useState<string | null>(null);

    const openTaskModal = (assigneeId: string | null = null) => {
        setTaskModalAssignee(assigneeId);
        setIsTaskModalOpen(true);
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }

    return (
        <div className="h-screen w-screen bg-slate-50 font-sans text-right" dir="rtl">
            <TaskCreationModal 
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onCreate={handleAddTask}
                assigneeId={taskModalAssignee}
                currentUserRole={currentUser.role}
            />

            {/* Top Bar for Logout */}
            <div className="absolute top-6 left-6 z-50">
                <button onClick={handleLogout} className="p-3 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-soft hover:shadow-lg transition-all" title="התנתק">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {currentUser.role === 'SUPER_ADMIN' ? (
                <AdminDashboard 
                    users={users}
                    tasks={tasks}
                    currentUser={currentUser}
                    onCreateUrgent={handleCreateUrgentTask}
                    onAddTask={openTaskModal}
                    onUpdateUser={handleUpdateUser}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    onToggleStatus={handleToggleUserStatus}
                    onUpdateNotes={handleUpdateNotes}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                />
            ) : (
                <EmployeeCockpit 
                    user={currentUser}
                    tasks={tasks.filter(t => t.assigneeId === currentUser.id)}
                    onToggle={handleToggleTask}
                    onComplete={handleCompleteTask}
                    onAddTask={() => openTaskModal(currentUser.id)}
                    onBlock={handleBlockTask}
                    onUpdateNotes={handleUpdateNotes}
                />
            )}
        </div>
    );
};