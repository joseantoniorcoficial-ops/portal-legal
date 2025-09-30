import React from 'react';
import { Calendar, CheckCircle, AlertTriangle, ExternalLink, Plus, X, ChevronLeft, ChevronRight, Clock, Users, FileText, Loader, Save } from 'lucide-react';

// --- LISTA DE USUARIOS AUTORIZADOS ---
// **ACCIÓN REQUERIDA**: Reemplaza 'REPLACE_WITH_REAL_NOTION_USER_ID' con los IDs de usuario reales de tu workspace de Notion.
const mockUsers = [
    { id: 'u-5', name: 'Mtro. José Antonio Ruiz de la Cruz', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
    { id: 'u-6', name: 'Lic. Sandra Luz Miguel Carrasco', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
    { id: 'u-7', name: 'Lic. Isabel Gómez Cruz', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
];


// --- UTILITY HOOKS & FUNCTIONS ---

// Hook para manejar el estado del formulario de reportes
const useReportForm = () => {
    const initialState = {
        id: null,
        titulo: '',
        descripcion: '',
        fechaModo: 'single',
        fechaRegistro: new Date().toISOString().split('T')[0],
        fechaRegistroEnd: '',
        remitente: [],
        destinatario: [],
        archivos: [],
        lastEditedBy: null,
        lastEditedTime: null,
    };
    const [formData, setFormData] = React.useState(initialState);
    const [errors, setErrors] = React.useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.titulo.trim()) newErrors.titulo = 'El título es requerido.';
        if (formData.remitente.length === 0) newErrors.remitente = 'Seleccione al menos un remitente.';
        if (formData.destinatario.length === 0) newErrors.destinatario = 'Seleccione al menos un destinatario.';
        if (formData.fechaModo === 'range' && !formData.fechaRegistroEnd) {
            newErrors.fechaRegistroEnd = 'La fecha de fin es requerida para un rango.';
        } else if (formData.fechaModo === 'range' && new Date(formData.fechaRegistroEnd) < new Date(formData.fechaRegistro)) {
            newErrors.fechaRegistroEnd = 'La fecha de fin no puede ser anterior a la de inicio.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const resetForm = () => setFormData(initialState);

    return { formData, setFormData, errors, validate, resetForm };
};

// --- API CLIENT ---
// Esta función ahora llama a NUESTRO PROPIO backend, no directamente a Notion.
// NOTA: Las claves secretas han sido eliminadas de este archivo.
const apiClient = {
    submitReport: async (data) => {
        try {
            // La llamada ahora se hace a una ruta relativa de nuestra propia aplicación.
            // Esta ruta contendrá la lógica del servidor (ver el archivo api/create-report.js).
            const response = await fetch('/api/create-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data), // Enviamos los datos del formulario al backend.
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error en el servidor.');
            }

            return {
                success: true,
                message: "Reporte guardado en Notion con éxito.",
                data: responseData,
            };

        } catch (error) {
            console.error("Error al contactar el backend:", error);
            return {
                success: false,
                message: `Error de conexión: ${error.message}. Asegúrate de que el backend esté funcionando.`
            };
        }
    }
};

// --- UI COMPONENTS ---

const Header = ({ onNavigate, activePage }) => (
    <header className="bg-slate-800 text-white shadow-lg p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">Asistencia Legal Ruiz de la Cruz</h1>
        <nav className="hidden md:flex items-center space-x-2">
            <NavButton icon={<ExternalLink size={18} />} label="Accesos Rápidos" active={activePage === 'accesos'} onClick={() => onNavigate('accesos')} />
            <NavButton icon={<FileText size={18} />} label="Reportes" active={activePage === 'reportes'} onClick={() => onNavigate('reportes')} />
            <NavButton icon={<Calendar size={18} />} label="Agenda" active={activePage === 'agenda'} onClick={() => onNavigate('agenda')} />
        </nav>
    </header>
);

const NavButton = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
            active ? 'bg-sky-600 text-white' : 'bg-transparent hover:bg-slate-700'
        }`}
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const FormInput = ({ label, id, error, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const MultiSelectPill = ({ user, onRemove }) => (
    <div className="bg-sky-100 text-sky-800 text-sm font-medium px-2 py-1 rounded-full flex items-center">
        <span>{user.name}</span>
        <button onClick={() => onRemove(user.id)} className="ml-2 text-sky-600 hover:text-sky-800">
            <X size={14} />
        </button>
    </div>
);

const MultiUserSelect = ({ label, id, selectedUsers, onChange, error }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const availableUsers = mockUsers.filter(u => !selectedUsers.includes(u.id));

    const handleSelect = (userId) => {
        onChange([...selectedUsers, userId]);
        setIsOpen(false);
    };

    const handleRemove = (userId) => {
        onChange(selectedUsers.filter(id => id !== userId));
    };

    return (
        <FormInput label={label} id={id} error={error}>
            <div className="relative">
                <div className="w-full bg-white p-2 border border-gray-300 rounded-lg min-h-[42px] flex flex-wrap gap-2 items-center" onClick={() => setIsOpen(!isOpen)}>
                    {selectedUsers.map(userId => {
                        const user = mockUsers.find(u => u.id === userId);
                        return user ? <MultiSelectPill key={user.id} user={user} onRemove={handleRemove} /> : null;
                    })}
                    {selectedUsers.length === 0 && <span className="text-gray-400">Seleccionar...</span>}
                </div>
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableUsers.length > 0 ? (
                            availableUsers.map(user => (
                                <div key={user.id} onClick={() => handleSelect(user.id)} className="px-4 py-2 hover:bg-sky-50 cursor-pointer">
                                    {user.name}
                                </div>
                            ))
                        ) : (
                             <div className="px-4 py-2 text-gray-500">No hay más usuarios para seleccionar.</div>
                        )}
                    </div>
                )}
            </div>
        </FormInput>
    );
};

const FileInput = ({ label, id, files, setFiles, error }) => {
    const handleFileChange = (e) => {
        setFiles([...files, ...Array.from(e.target.files)]);
    };
    
    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    return (
        <FormInput label={label} id={id} error={error}>
            <p className="text-xs text-gray-500 mb-2">Nota: La subida de archivos a Notion requiere un servidor intermedio y no está implementada en este prototipo.</p>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                            <span>Sube un archivo</span>
                            <input id={id} name={id} type="file" className="sr-only" multiple onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
                </div>
            </div>
             {files && files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                            <span className="text-sm text-gray-800 truncate">{file.name}</span>
                            <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </FormInput>
    );
};


const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    
    const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in-down";
    const typeClasses = {
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800'
    };
    
    const Icon = type === 'success' ? CheckCircle : AlertTriangle;

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <Icon size={24} />
            <span>{message}</span>
            <button onClick={onClose} className="absolute top-1 right-1">
              <X size={16} />
            </button>
        </div>
    );
};


// --- PAGES ---

const ReportesPage = () => {
    const { formData, setFormData, errors, validate, resetForm } = useReportForm();
    const [status, setStatus] = React.useState('idle'); // idle, loading, success, error
    const [notification, setNotification] = React.useState({ message: '', type: '' });
    
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setStatus('loading');
        setNotification({ message: '', type: '' });
        
        // La llamada ahora se hace a través de nuestro cliente API seguro.
        const result = await apiClient.submitReport(formData);

        if (result.success) {
            setStatus('success');
            setNotification({ message: result.message, type: 'success' });
            setFormData(prev => ({
                ...prev,
                lastEditedBy: result.data.last_edited_by.name,
                lastEditedTime: new Date(result.data.last_edited_time).toLocaleString('es-MX')
            }));
            resetForm(); 
        } else {
            setStatus('error');
            setNotification({ message: result.message, type: 'error' });
        }
    };
    
    React.useEffect(() => {
        if(notification.message) {
            const timer = setTimeout(() => setNotification({ message: '', type: ''}), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <div className="p-4 md:p-8">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })}/>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Formulario de Reporte Penal</h2>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                
                <FormInput label="Título del Reporte" id="titulo" error={errors.titulo}>
                    <input
                        type="text"
                        id="titulo"
                        value={formData.titulo}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </FormInput>

                <FormInput label="Descripción (Opcional)" id="descripcion">
                    <textarea
                        id="descripcion"
                        rows="4"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    ></textarea>
                </FormInput>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Registro</label>
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="fecha-single"
                                name="fechaModo"
                                value="single"
                                checked={formData.fechaModo === 'single'}
                                onChange={(e) => setFormData(prev => ({ ...prev, fechaModo: e.target.value }))}
                                className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                            />
                            <label htmlFor="fecha-single" className="ml-2 block text-sm text-gray-900">Fecha única</label>
                        </div>
                         <div className="flex items-center">
                            <input
                                type="radio"
                                id="fecha-range"
                                name="fechaModo"
                                value="range"
                                checked={formData.fechaModo === 'range'}
                                onChange={(e) => setFormData(prev => ({ ...prev, fechaModo: e.target.value }))}
                                className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                            />
                            <label htmlFor="fecha-range" className="ml-2 block text-sm text-gray-900">Rango de fechas</label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormInput label={formData.fechaModo === 'range' ? "Fecha de Inicio" : "Fecha"} id="fechaRegistro">
                           <input type="date" id="fechaRegistro" value={formData.fechaRegistro} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                       </FormInput>
                       {formData.fechaModo === 'range' && (
                           <FormInput label="Fecha de Fin" id="fechaRegistroEnd" error={errors.fechaRegistroEnd}>
                               <input type="date" id="fechaRegistroEnd" value={formData.fechaRegistroEnd} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                           </FormInput>
                       )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MultiUserSelect
                        label="Remitente(s)"
                        id="remitente"
                        selectedUsers={formData.remitente}
                        onChange={(ids) => setFormData(prev => ({ ...prev, remitente: ids }))}
                        error={errors.remitente}
                    />
                    <MultiUserSelect
                        label="Destinatario(s)"
                        id="destinatario"
                        selectedUsers={formData.destinatario}
                        onChange={(ids) => setFormData(prev => ({ ...prev, destinatario: ids }))}
                        error={errors.destinatario}
                    />
                </div>
                
                <FileInput
                    label="Archivos y Multimedia"
                    id="archivos"
                    files={formData.archivos}
                    setFiles={(newFiles) => setFormData(prev => ({ ...prev, archivos: newFiles }))}
                />

                <div className="flex items-center justify-between pt-4 border-t">
                     <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : <Save className="-ml-1 mr-2 h-5 w-5"/>}
                        {formData.id ? 'Actualizar Reporte' : 'Enviar Reporte'}
                    </button>
                    {(formData.lastEditedBy || status === 'success') && (
                         <div className="text-sm text-gray-500">
                             Última edición: {formData.lastEditedTime} por <strong>{formData.lastEditedBy}</strong>
                         </div>
                    )}
                </div>
            </form>
        </div>
    );
};

const AgendaPage = () => {
    const calendarUrl = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1AbFySjO36y16FM2wlQEUHtpkxRFrU9yI1TBoMRhNEPF80KKtIDHBDM3UjE24-EOFWQ85zRh8R";

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-64px)] flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex-shrink-0">Sistema de Agenda Integrado</h2>
            <div className="bg-white rounded-lg shadow-md flex-grow">
                <iframe
                    src={calendarUrl}
                    title="Google Calendar Agenda"
                    style={{ border: 0 }}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="yes"
                ></iframe>
            </div>
        </div>
    );
};

const AccesosPage = () => {
    const links = [
        { label: "Reportar Notificación Civil", url: "https://ruizdelacruzatencionalcliente.notion.site/27a3329992568065819eebd9d472ffd6?pvs=105" },
        { label: "Actualizar un Caso Civil", url: "https://ruizdelacruzatencionalcliente.notion.site/27a33299925680428239c3c2a59a69d1?pvs=105" },
        { label: "Ir al Espacio Civil (Notion)", url: "https://www.notion.so/20333299925680bf8afbdf3bcda31891" },
        { label: "Herramientas Lic. Sandra Luz MC", url: "https://www.notion.so/ruizdelacruzatencionalcliente/LIC-SANDRA-LUZ-MIGUEL-CARRASCO-27a332999256806db633ef519444d53e?source=copy_link" },
        { label: "Herramientas Lic. Isabel Gómez Cruz", url: "https://www.notion.so/ruizdelacruzatencionalcliente/LIC-ISABEL-G-MEZ-CRUZ-27a332999256805ebffadda957e99f58?source=copy_link" }
    ];

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Accesos Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map(link => (
                    <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{link.label}</h3>
                            <p className="text-sm text-gray-600">Se abrirá en una nueva pestaña para mayor comodidad.</p>
                        </div>
                        <div className="flex items-center text-sky-600 mt-4">
                            <span>Acceder ahora</span>
                            <ExternalLink className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [activePage, setActivePage] = React.useState('accesos');

    const renderPage = () => {
        switch (activePage) {
            case 'reportes':
                return <ReportesPage />;
            case 'agenda':
                return <AgendaPage />;
            case 'accesos':
                return <AccesosPage />;
            default:
                return <AccesosPage />;
        }
    };
    
    const BottomNav = () => (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-2 flex justify-around">
             <NavButton icon={<ExternalLink size={20} />} label="Accesos" active={activePage === 'accesos'} onClick={() => setActivePage('accesos')} />
             <NavButton icon={<FileText size={20} />} label="Reportes" active={activePage === 'reportes'} onClick={() => setActivePage('reportes')} />
            <NavButton icon={<Calendar size={20} />} label="Agenda" active={activePage === 'agenda'} onClick={() => setActivePage('agenda')} />
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header onNavigate={setActivePage} activePage={activePage} />
            <main className="pb-20 md:pb-0">
                {renderPage()}
            </main>
            <BottomNav />
        </div>
    );
}

