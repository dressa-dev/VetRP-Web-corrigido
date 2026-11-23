
import React, { useState, useEffect } from 'react';

import {
  PawPrint,
  CalendarDays,
  FlaskConical,
  Users,
  LogOut,
  Accessibility,
  ChartPie,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

import logo from './assets/logo-vetrp.png';

const apiBase =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

function authHeader(email, password) {
  return 'Basic ' +
    btoa(unescape(encodeURIComponent(email + ':' + password)));
}

async function request(path, options = {}, authorization) {
  const response = await fetch(apiBase + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (response.status === 403) {
      throw new Error('Você não tem permissão para esta operação.');
    }

    if (response.status === 409) {
      throw new Error('Registro duplicado ou horário indisponível.');
    }

    throw new Error(
      'Não foi possível concluir a operação (' +
      response.status + ').'
    );
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

const slots = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30'
];

function today() {
  return new Date().toLocaleDateString('en-CA');
}

function formatDate(d) {
  if (!d) return '—';

  return new Date(`${d}T12:00:00`)
    .toLocaleDateString('pt-BR');
}

function App() {
  const [profile, setProfile] = useState('tutor');
  const [screen, setScreen] = useState('home');
  const [avatar, setAvatar] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');

  const [user, setUser] = useState(null);
  const [authorization, setAuthorization] = useState(null);

  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [slotForm, setSlotForm] = useState({
    data: '',
    hora: '09:00',
    liberado: true,
    tipo: 'Consulta',
    profissional: ''
  });

  const [report, setReport] = useState(null);
  const [dashboard, setDashboard] = useState({ semanaAnterior: null, mesAnterior: null });
  const [lastSync, setLastSync] = useState(null);


  const [period, setPeriod] = useState({
    inicio: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toLocaleDateString('en-CA'),
    fim: today()
  });

  const [selected, setSelected] = useState(1);
  const [search, setSearch] = useState('');
  const [agendaDate, setAgendaDate] = useState('');

  // INFORMAÇÕES PESSOAIS
  const [personal, setPersonal] = useState(null);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [personalLoading, setPersonalLoading] = useState(false);

  // ACESSIBILIDADE
  const [fontSize, setFontSize] = useState(() =>
    Number(localStorage.getItem('vetrp-font') || 18)
  );

  const [theme, setTheme] = useState(() =>
    localStorage.getItem('vetrp-theme') || 'default'
  );

  const [accessOpen, setAccessOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // CADASTRO DE ANIMAIS
  const [editingPetId, setEditingPetId] = useState(null);

  const [petForm, setPetForm] = useState({
    nome: '',
    especie: 'Canina',
    raca: '',
    sexo: 'Fêmea',
    nascimento: '',
    peso: '',
    pelagem: '',
    observacoes: ''
  });

  // ENDEREÇO
  const [address, setAddress] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  });

  const [cepStatus, setCepStatus] = useState('');

  function changeAddress(field, value) {
    setAddress(previous => ({
      ...previous,
      [field]: value
    }));
  }

  useEffect(() => {
    const digits = address.cep.replace(/\D/g, '');

    if (digits.length !== 8) {
      setCepStatus('');
      return;
    }

    const controller = new AbortController();

    setCepStatus('Buscando endereço...');

    fetch(
      `https://viacep.com.br/ws/${digits}/json/`,
      { signal: controller.signal }
    )
.then(async response => {
  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP.');
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
})
      .then(data => {
        if (data.erro) {
          setCepStatus('CEP não encontrado.');
          return;
        }

        setAddress(previous => ({
          ...previous,
          rua: data.logradouro || previous.rua,
          bairro: data.bairro || previous.bairro,
          cidade: data.localidade || previous.cidade,
          uf: data.uf || previous.uf
        }));

        setCepStatus('Endereço encontrado.');
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setCepStatus('Preencha o endereço manualmente.');
        }
      });

    return () => controller.abort();
  }, [address.cep]);

  // FUNCIONÁRIOS
  const [employees, setEmployees] = useState([]);

  const [employeeForm, setEmployeeForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'RECEPCAO',
    cargo: 'Recepcionista',
    telefone: '',
    crmv: '',
    crmvUf: 'SP',
    especialidade: ''
  });

  // AGENDAMENTO
  const [booking, setBooking] = useState({
    pet: '',
    tipo: 'Consulta',
    data: '',
    hora: '',
    profissional: '',
    motivo: ''
  });

  // CONFIGURAÇÕES DE ACESSIBILIDADE
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.dataset.theme = theme;

    localStorage.setItem('vetrp-font', fontSize);
    localStorage.setItem('vetrp-theme', theme);
  }, [fontSize, theme]);

  // NAVEGAÇÃO
  function navigate(page) {
    setScreen(page);
    setNotice('');
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }

  // VALIDAÇÃO DE SENHA FORTE
  function validatePassword(value) {
    return (
      value.length >= 10 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  }

  // FOTO DE PERFIL TEMPORÁRIA
  function changeAvatar(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice('Selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotice('A imagem deve ter no máximo 2 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(String(reader.result));
      setNotice('Foto selecionada com sucesso.');
    };

    reader.onerror = () => {
      setNotice('Não foi possível carregar a imagem.');
    };

    reader.readAsDataURL(file);
  }

  // LOGIN
  async function login(e) {
    e.preventDefault();

    try {
      const credential = authHeader(email, password);

      const data = await request(
        '/api/auth/me',
        {},
        credential
      );

      if (
        (profile === 'tutor' && data.perfil !== 'TUTOR') ||
        (profile === 'clinica' && data.perfil === 'TUTOR')
      ) {
        throw new Error(
          'Este usuário não pertence ao perfil selecionado.'
        );
      }

      const [p, a] = await Promise.all([
        request('/api/animais', {}, credential),
        request('/api/agendamentos', {}, credential)
      ]);

      setAuthorization(credential);
      setUser(data);
      setPets(Array.isArray(p) ? p : []);
      setAppointments(Array.isArray(a) ? a : []);
      setAvatar('');

      navigate(data.perfil === 'TUTOR' ? 'pets' : 'dashboard');
      setPassword('');

    } catch (err) {
      setNotice(err.message);
    }
  }

  // CADASTRO DE TUTOR
  async function register(e) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('senha') || '');

    if (!validatePassword(newPassword)) {
      setNotice(
        'A senha deve conter pelo menos 10 caracteres, ' +
        'uma letra maiúscula, uma minúscula, ' +
        'um número e um caractere especial.'
      );
      return;
    }

    try {
      await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.get('nome'),
          email: form.get('email'),
          senha: newPassword,
          telefone: form.get('telefone'),
          cep: form.get('cep'),
          rua: form.get('rua'),
          numero: form.get('numero'),
          complemento: form.get('complemento'),
          bairro: form.get('bairro'),
          cidade: form.get('cidade'),
          uf: form.get('uf')
        })
      });

      setProfile('tutor');
      navigate('login');

      setNotice(
        'Conta criada! Faça login com seu e-mail e senha.'
      );

    } catch (err) {
      setNotice(err.message);
    }
  }

  // ATUALIZAR ANIMAIS E AGENDAMENTOS
  async function refresh(credential = authorization) {
    const [p, a] = await Promise.all([
      request('/api/animais', {}, credential),
      request('/api/agendamentos', {}, credential)
    ]);

    setPets(Array.isArray(p) ? p : []);
    setAppointments(Array.isArray(a) ? a : []);
  }

  // CONSULTAR HORÁRIOS DISPONÍVEIS
  useEffect(() => {
    if (!authorization || !booking.data) {
      setAvailableSlots([]);
      return;
    }

    request(
      '/api/horarios?data=' + booking.data,
      {},
      authorization
    )
      .then(data => setAvailableSlots(Array.isArray(data) ? data : []) )
      .catch(err => setNotice(err.message));

  }, [authorization, booking.data, appointments]);

  // CARREGAR INFORMAÇÕES PESSOAIS
  async function loadPersonal() {
    setPersonalLoading(true);

    try {
      const data = await request(
        '/api/auth/dados',
        {},
        authorization
      );

      setPersonal(data);

      setPersonalForm({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cep: data.cep || '',
        rua: data.rua || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        uf: data.uf || ''
      });

      setEditingPersonal(false);

    } catch (err) {
      setNotice(err.message);

    } finally {
      setPersonalLoading(false);
    }
  }

  // SALVAR INFORMAÇÕES PESSOAIS
  async function savePersonal(e) {
    e.preventDefault();

    try {
      const updated = await request(
        '/api/auth/dados',
        {
          method: 'PUT',
          body: JSON.stringify(personalForm)
        },
        authorization
      );

      setPersonal(updated);

      setUser(previous => ({
        ...previous,
        nome: updated.nome
      }));

      if (updated.email !== personal.email) {
        setUser(null);
        setAuthorization(null);
        setPets([]);
        setAppointments([]);
        setAvatar('');

        setEmail(updated.email);
        setPassword('');

        navigate('login');

        setNotice(
          'Dados salvos. Como o e-mail mudou, entre novamente.'
        );

      } else {
        setEditingPersonal(false);

        setNotice(
          'Informações pessoais atualizadas com sucesso.'
        );
      }

    } catch (err) {
      setNotice(err.message);
    }
  }

  // BUSCAR ENDEREÇO AO EDITAR O CEP
  useEffect(() => {
    if (!editingPersonal || !personalForm.cep) return;

    const digits = personalForm.cep.replace(/\D/g, '');

    if (digits.length !== 8) return;

    const controller = new AbortController();

    fetch(
      `https://viacep.com.br/ws/${digits}/json/`,
      { signal: controller.signal }
    )
     .then(async response => {
        if (!response.ok) {
          throw new Error('Erro ao consultar o CEP.');
        }

        const body = await response.text();
  return body ? JSON.parse(body) : null;
      })
      .then(data => {
        if (data.erro) return;

        setPersonalForm(previous => ({
          ...previous,
          rua: data.logradouro || previous.rua,
          bairro: data.bairro || previous.bairro,
          cidade: data.localidade || previous.cidade,
          uf: data.uf || previous.uf
        }));
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setNotice(
            'Não foi possível consultar o CEP. Preencha manualmente.'
          );
        }
      });

    return () => controller.abort();

  }, [editingPersonal, personalForm.cep]);

  // LISTAR FUNCIONÁRIOS
  async function loadEmployees() {
    try {
      const data = await request(
        '/api/clinica/funcionarios',
        {},
        authorization
      );

      setEmployees(Array.isArray(data) ? data : []);

    } catch (err) {
      setNotice(err.message);
    }
  }

  // CADASTRAR FUNCIONÁRIO
  async function saveEmployee(e) {
    e.preventDefault();

    if (!validatePassword(employeeForm.senha)) {
      setNotice(
        'A senha do funcionário deve ter pelo menos ' +
        '10 caracteres, incluindo maiúscula, minúscula, ' +
        'número e símbolo.'
      );
      return;
    }

    try {
      await request(
        '/api/clinica/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify(employeeForm)
        },
        authorization
      );

      setEmployeeForm({
        nome: '',
        email: '',
        senha: '',
        perfil: 'RECEPCAO',
        telefone: '',
        crmv: '',
        crmvUf: 'SP',
        especialidade: ''
      });

      await loadEmployees();

      setNotice(
        'Funcionário cadastrado com sucesso.'
      );

    } catch (err) {
      setNotice(err.message);
    }
  }

  // ATIVAR OU DESATIVAR FUNCIONÁRIO
  async function toggleEmployee(employee) {
    try {
      await request(
        `/api/clinica/funcionarios/${employee.id}/ativo?ativo=${!employee.ativo}`,
        { method: 'PATCH' },
        authorization
      );

      await loadEmployees();

      setNotice('Acesso atualizado.');

    } catch (err) {
      setNotice(err.message);
    }
  }

  // LIBERAR OU BLOQUEAR HORÁRIOS
  async function saveSlot(e) {
    e.preventDefault();

    try {
      await request(
        '/api/clinica/horarios',
        {
          method: 'POST',
          body: JSON.stringify(slotForm)
        },
        authorization
      );

      setNotice(
        'Horário atualizado com sucesso.'
      );

    } catch (err) {
      setNotice(err.message);
    }
  }

  // CARREGAR RELATÓRIOS
  async function loadReport() {
    try {
      const data = await request(
        '/api/clinica/relatorios?inicio=' +
          period.inicio +
          '&fim=' +
          period.fim,
        {},
        authorization
      );

      setReport(data);

    } catch (err) {
      setNotice(err.message);
    }
  }

  // FORMULÁRIO VAZIO PARA ANIMAIS
  const emptyPetForm = () => ({
    nome: '',
    especie: 'Canina',
    raca: '',
    sexo: 'Fêmea',
    nascimento: '',
    peso: '',
    pelagem: '',
    observacoes: ''
  });

  // ABRIR CADASTRO DE ANIMAL
  function startNewPet() {
    setEditingPetId(null);
    setPetForm(emptyPetForm());
    navigate('newpet');
  }

  // EDITAR ANIMAL
  function editPet(animal) {
    if (!animal) return;

    setEditingPetId(animal.id);

    setPetForm({
      nome: animal.nome || '',
      especie: animal.especie || 'Canina',
      raca: animal.raca || '',
      sexo: animal.sexo || 'Fêmea',
      nascimento: animal.nascimento || '',
      peso: animal.peso ?? '',
      pelagem: animal.pelagem || '',
      observacoes: animal.observacoes || ''
    });

    navigate('newpet');
  }

  // SALVAR ANIMAL
  async function savePet(e) {
    e.preventDefault();

    try {
      const editing = editingPetId !== null;

      const saved = await request(
        editing
          ? `/api/animais/${editingPetId}`
          : '/api/animais',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({
            ...petForm,
            peso:
              petForm.peso !== ''
                ? Number(petForm.peso)
                : null,
            nascimento: petForm.nascimento || null
          })
        },
        authorization
      );

      await refresh();

      setSelected(saved.id);
      setEditingPetId(null);
      setPetForm(emptyPetForm());

      navigate('pets');

      setNotice(
        editing
          ? 'Dados do animal atualizados com sucesso.'
          : 'Animal cadastrado com sucesso.'
      );

    } catch (err) {
      setNotice(err.message);
    }
  }

  // CRIAR AGENDAMENTO
  async function saveBooking(e) {
    e.preventDefault();

    if (!booking.hora) {
      setNotice('Escolha um horário disponível.');
      return;
    }

    try {
      await request(
        '/api/agendamentos',
        {
          method: 'POST',
          body: JSON.stringify({
            animalId: Number(booking.pet),
            horarioId: Number(booking.hora),
            tipo: booking.tipo,
            motivo: booking.motivo,
            profissional: booking.profissional
          })
        },
        authorization
      );

      await refresh();

      navigate('bookings');

      setNotice('Agendamento confirmado.');

    } catch (err) {
      setNotice(err.message);
    }
  }

  // CANCELAR AGENDAMENTO
  async function cancelBooking(id) {
    if (!window.confirm('Cancelar este agendamento?')) {
      return;
    }

    try {
      await request(
        '/api/agendamentos/' + id + '/cancelar',
        { method: 'PATCH' },
        authorization
      );

      await refresh();

      setNotice('Agendamento cancelado.');

    } catch (err) {
      setNotice(err.message);
    }
  }

  // PAINEL GERENCIAL: números calculados no servidor, nunca simulados.
  useEffect(() => {
    if (!authorization || !user || user.perfil === 'TUTOR') return;
    let active = true;
    const iso = date => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const update = async () => {
      const now = new Date();
      const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekday = (thisMonday.getDay() + 6) % 7;
      thisMonday.setDate(thisMonday.getDate() - weekday);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(lastSunday.getDate() - 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      try {
        const [semanaAnterior, mesAnterior, agenda] = await Promise.all([
          request(`/api/clinica/relatorios?inicio=${iso(lastMonday)}&fim=${iso(lastSunday)}`, {}, authorization),
          request(`/api/clinica/relatorios?inicio=${iso(lastMonthStart)}&fim=${iso(lastMonthEnd)}`, {}, authorization),
          request('/api/agendamentos', {}, authorization)
        ]);
        if (active) {
          setDashboard({ semanaAnterior, mesAnterior });
          setAppointments(agenda);
          setLastSync(new Date().toLocaleTimeString('pt-BR'));
        }
      } catch (error) {
        if (active) setNotice(error.message);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [authorization, user?.perfil]);

  // PERFIL E MENU
  const isClinic = Boolean(
    user && user.perfil !== 'TUTOR'
  );

  const current =
    pets.find(p => p.id === selected) || pets[0];

  const navigation = isClinic
    ? [
        ['dashboard', 'Visão geral', ChartPie],
        ['agenda', 'Agenda da clínica', CalendarDays],
        ['slots', 'Liberar horários', CalendarDays],
        ['patients', 'Pacientes', Users],
         ['records', 'Prontuários', PawPrint],
        ['reports', 'Relatórios', ChartPie],
        ...(user?.perfil === 'ADMIN'
          ? [['employees', 'Funcionários', Users]]
          : [])
      ]
    : [
        ['pets', 'Meus animais', PawPrint],
        ['newpet', 'Cadastrar animal', Plus],
        ['consult', 'Agendar consulta', CalendarDays],
        ['exam', 'Agendar exame', FlaskConical],
        ['bookings', 'Meus agendamentos', CalendarDays]
      ];

  // ABRIR PERFIL PELO NOME OU FOTO
  function openProfile() {
    navigate('personal');
    loadPersonal();
  }

  return (
    <div className="app">

      {/* BOTÃO DE ACESSIBILIDADE */}
      <button
        className="access-toggle"
        onClick={() => setAccessOpen(x => !x)}
        aria-expanded={accessOpen}
        aria-controls="access-panel"
        aria-label="Abrir opções de acessibilidade"
      >
        <Accessibility size={25} />
        <span>Acessibilidade</span>
      </button>

      {/* PAINEL DE ACESSIBILIDADE */}
      {accessOpen && (
        <aside
          id="access-panel"
          className="access-panel"
          aria-label="Configurações de acessibilidade"
        >
          <h2>Acessibilidade</h2>

          <label htmlFor="font-range">
            Tamanho do texto: {fontSize}px
          </label>

          <input
            id="font-range"
            type="range"
            min="16"
            max="24"
            value={fontSize}
            onChange={e =>
              setFontSize(Number(e.target.value))
            }
          />

          <div className="actions">
            <button
              type="button"
              className={theme === 'default' ? 'chosen' : ''}
              onClick={() => setTheme('default')}
            >
              Padrão
            </button>

            <button
              type="button"
              className={theme === 'dark' ? 'chosen' : ''}
              onClick={() => setTheme('dark')}
            >
              Escuro
            </button>

            <button
              type="button"
              className={theme === 'high' ? 'chosen' : ''}
              onClick={() => setTheme('high')}
            >
              Alto contraste
            </button>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() => setAccessOpen(false)}
          >
            Fechar
          </button>
        </aside>
      )}


      {/* ÁREA PÚBLICA DO SITE */}
      {!user && screen === 'home' && (
        <div className="public-site">

          {/* MENU SUPERIOR */}
          <header className="public-header">
            <div className="public-header-inner">
              <button
                type="button"
                className="public-logo-button"
                onClick={() => navigate('home')}
                aria-label="Página inicial VetRP"
              >
                <img
                  src={logo}
                  alt="Clínica Veterinária VetRP"
                  className="public-logo"
                />
              </button>

              <nav
                className="public-nav"
                aria-label="Navegação do site"
              >
                <a href="#inicio">Início</a>
                <a href="#sobre">Sobre nós</a>
                <a href="#profissionais">Profissionais</a>
                <a href="#servicos">Serviços</a>
                <a href="#contato">Contato</a>
              </nav>

              <div className="public-header-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate('login')}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate('register')}
                >
                  Criar conta
                </button>
              </div>
            </div>
          </header>

          {/* DESTAQUE PRINCIPAL */}
          <main>
            <section
              id="inicio"
              className="public-hero"
            >
              <video
                className="vetrp-hero-video"
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
              >
                <source src="/videos/vetrp-hero.mp4" type="video/mp4" />
              </video>
              <div className="vetrp-hero-overlay" aria-hidden="true" />
              <div className="public-hero-content">
                <span className="public-eyebrow">
                  Clínica Veterinária VetRP
                </span>

                <h1>
                  Cuidado veterinário,
                  com carinho de verdade.
                </h1>

                <p>
                  Cuidamos de quem faz parte da sua
                  família. Agende consultas e exames
                  com praticidade e acompanhe as
                  informações do seu animal em um
                  só lugar.
                </p>

                <div className="public-hero-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => navigate('login')}
                  >
                    <CalendarDays size={20} />
                    Agendar atendimento
                  </button>

                  <a
                    href="#servicos"
                    className="public-outline-button"
                  >
                    Conheça nossos serviços
                  </a>
                </div>

                <div className="public-hero-note">
                  <PawPrint size={20} />
                  <span>
                    O cuidado começa antes da consulta.
                  </span>
                </div>
              </div>


            </section>

            {/* SOBRE A CLÍNICA */}
            <section
              id="sobre"
              className="public-section public-about"
            >
              <div className="public-section-heading">
                <span className="public-eyebrow">
                  QUEM SOMOS
                </span>

                <h2>
                  Amor, dedicação e cuidado em
                  cada atendimento.
                </h2>
              </div>

              <div className="public-about-grid">
                <div className="public-about-text">
                  <p>
                    Na Clínica Veterinária VetRP,
                    acreditamos que cada animal merece
                    atenção, respeito e carinho.
                  </p>

                  <p>
                    Nosso compromisso é oferecer
                    atendimento veterinário acolhedor,
                    pensando na saúde e no bem-estar
                    dos pets e na tranquilidade
                    de seus tutores.
                  </p>

                  <p>
                    Estamos no Grajaú, na Zona Sul
                    de São Paulo, cuidando dos
                    animais da nossa comunidade.
                  </p>

                  <button
                    type="button"
                    className="primary"
                    onClick={() => navigate('register')}
                  >
                    Faça parte da VetRP
                  </button>
                </div>

                <div className="public-about-highlight">
                  <PawPrint size={48} />

                  <h3>
                    Seu pet faz parte da família.
                  </h3>

                  <p>
                    E merece receber cuidado
                    com atenção em cada etapa
                    da vida.
                  </p>
                </div>
              </div>
            </section>

            {/* SERVIÇOS */}
            <section
              id="servicos"
              className="public-section public-services"
            >
              <div className="public-section-heading">
                <span className="public-eyebrow">
                  NOSSOS SERVIÇOS
                </span>

                <h2>
                  Cuidado completo para o seu pet
                </h2>

                <p>
                  Conheça alguns dos atendimentos
                  oferecidos pela VetRP.
                </p>
              </div>

              <div className="public-services-grid">

                <article className="public-service-card">
                  <div className="public-service-icon">
                    <PawPrint size={30} />
                  </div>

                  <h3>Consultas veterinárias</h3>

                  <p>
                    Acompanhamento da saúde do
                    seu animal com atenção
                    individualizada.
                  </p>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigate('login')}
                  >
                    Agendar consulta
                  </button>
                </article>

                <article className="public-service-card">
                  <div className="public-service-icon">
                    <FlaskConical size={30} />
                  </div>

                  <h3>Exames</h3>

                  <p>
                    Exames veterinários para
                    auxiliar na avaliação e
                    no acompanhamento da
                    saúde dos pets.
                  </p>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigate('login')}
                  >
                    Agendar exame
                  </button>
                </article>

                <article className="public-service-card">
                  <div className="public-service-icon">
                    <CalendarDays size={30} />
                  </div>

                  <h3>Cirurgias</h3>

                  <p>
                    Procedimentos cirúrgicos
                    realizados conforme a
                    avaliação e a indicação
                    veterinária.
                  </p>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigate('login')}
                  >
                    Acessar minha conta
                  </button>
                </article>

                <article className="public-service-card">
                  <div className="public-service-icon">
                    <PawPrint size={30} />
                  </div>

                  <h3>Vacinação</h3>

                  <p>
                    Cuidados preventivos para
                    ajudar a proteger a saúde
                    e o bem-estar dos animais.
                  </p>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigate('login')}
                  >
                    Entrar no sistema
                  </button>
                </article>

              </div>
            </section>

            {/* PROFISSIONAIS — APRESENTAÇÃO PÚBLICA */}
            <section id="profissionais" className="public-section vetrp-professionals">
              <div className="public-section-heading">
                <span className="public-eyebrow">NOSSA EQUIPE</span>
                <h2>Profissionais dedicados ao bem-estar animal</h2>
                <p>Conheça a equipe responsável pelo cuidado com seu pet. Os dados profissionais abaixo são exemplos e serão substituídos pelas informações oficiais da clínica.</p>
              </div>
              <div className="vetrp-professional-grid">
                <article className="vetrp-professional-card">
                  <div className="vetrp-professional-avatar"><PawPrint size={38} /></div>
                  <h3>Dra. Marina Oliveira</h3>
                  <p>Médica-veterinária • Clínica geral</p>
                  <small> A médica</small>
                </article>
                <article className="vetrp-professional-card">
                  <div className="vetrp-professional-avatar"><PawPrint size={38} /></div>
                  <h3>Dr. Rafael Costa</h3>
                  <p>Médico-veterinário • Atendimento clínico</p>
                  <small>O atendimento</small>
                </article>
              </div>
              <div className="vetrp-professional-access">
                <div>
                  <h3>Você faz parte da equipe VetRP?</h3>
                  <p>Acesse sua área profissional para consultar a agenda e os indicadores da clínica.</p>
                </div>
                <button type="button" className="primary" onClick={() => { setProfile('clinica'); navigate('login'); }}>Acesso para profissionais</button>
              </div>
            </section>

            {/* CHAMADA PARA CADASTRO */}
            <section className="public-cta">
              <div>
                <span className="public-eyebrow">
                  VETRP WEB
                </span>

                <h2>
                  Mais praticidade para cuidar
                  de quem você ama.
                </h2>

                <p>
                  Cadastre seus animais, consulte
                  seus dados e organize seus
                  agendamentos pelo nosso sistema.
                </p>
              </div>

              <button
                type="button"
                className="primary"
                onClick={() => navigate('register')}
              >
                Criar minha conta
              </button>
            </section>

            {/* CONTATO */}
            <section
              id="contato"
              className="public-section public-contact"
            >
              <div className="public-section-heading">
                <span className="public-eyebrow">
                  FALE CONOSCO
                </span>

                <h2>
                  Estamos aqui para cuidar
                  do seu melhor amigo.
                </h2>

                <p>
                  Clínica Veterinária VetRP
                  — Grajaú, Zona Sul de São Paulo.
                </p>
              </div>

              <div className="public-contact-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate('login')}
                >
                  Acessar agendamentos
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate('register')}
                >
                  Cadastrar tutor
                </button>
              </div>
            </section>
          </main>

          {/* RODAPÉ COMPLETO — CONTATOS PROVISÓRIOS */}
          <footer className="public-footer vetrp-footer">
            <div className="vetrp-footer-grid">
              <div>
                <img src={logo} alt="VetRP" className="public-footer-logo" />
                <p>Cuidando do seu pet de forma mais simples.</p>
                <small>Grajaú • Zona Sul de São Paulo</small>
              </div>
              <div>
                <h3>Navegação</h3>
                <a href="#inicio">Início</a>
                <a href="#sobre">Sobre a clínica</a>
                <a href="#servicos">Serviços</a>
                <a href="#profissionais">Profissionais</a>
              </div>
              <div>
                <h3>Atendimento</h3>
                <p>Telefone: (11) 0000-0000</p>
                <p>WhatsApp: (11) 90000-0000</p>
                <p>E-mail: contato@exemplo.com</p>
                <small>Dados fictícios para substituição.</small>
              </div>
              <div>
                <h3>Acesso ao sistema</h3>
                <button type="button" className="vetrp-footer-link" onClick={() => { setProfile('tutor'); navigate('login'); }}>Área do tutor</button>
                <button type="button" className="vetrp-footer-link" onClick={() => { setProfile('clinica'); navigate('login'); }}>Área dos profissionais</button>
                <button type="button" className="vetrp-footer-link" onClick={() => navigate('register')}>Criar conta de tutor</button>
              </div>
            </div>
            <div className="vetrp-footer-bottom">
              <small>© {new Date().getFullYear()} Clínica Veterinária VetRP. Todos os direitos reservados.</small>
              <small>Informações de contato e profissionais ilustrativas.</small>
              <a className="footer-privacy-link" href="/privacidade.html" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
            </div>
          </footer>

        </div>
      )}


      {/* LOGIN, CADASTRO E RECUPERAÇÃO */}
      {!user && screen !== 'home' && (
        <div className="auth">

          <header className="auth-header">
            <button
              type="button"
              className="public-logo-button"
              onClick={() => navigate('home')}
              aria-label="Voltar à página inicial"
            >
              <img
                src={logo}
                alt="Clínica Veterinária VetRP"
              />
            </button>

            <button
              type="button"
              className="secondary compact"
              onClick={() => navigate('home')}
            >
              <ArrowLeft size={18} />
              Voltar ao site
            </button>
          </header>

          <main className="auth-grid">

            {/* APRESENTAÇÃO */}
            <section className="intro">
              <span className="pill">
                Clínica Veterinária VetRP
              </span>

              <h1>
                Cuidando de quem faz parte
                da sua família.
              </h1>

              <p>
                Cadastre seus animais, acompanhe
                suas informações e agende consultas
                e exames com praticidade.
              </p>

              <div className="intro-art">
                <video autoPlay muted loop playsInline aria-hidden="true">
                  <source src="/videos/vetrp-hero.mp4" type="video/mp4" />
                </video>
                <div className="intro-art-caption">
                  <PawPrint size={24} />
                  <p>O cuidado começa antes da consulta.</p>
                </div>
              </div>
            </section>

            {/* FORMULÁRIOS */}
            <section className="panel login-panel">

              <h1>
                {screen === 'register'
                  ? 'Cadastro de tutor'
                  : screen === 'recover'
                    ? 'Recuperar senha'
                    : 'Bem-vindo ao VetRP'}
              </h1>

              {/* LOGIN */}
              {screen === 'login' && (
                <form onSubmit={login}>

                  <p>
                    Entre com sua conta para acessar
                    o sistema.
                  </p>

                  <div className="profile-row">
                    <button
                      type="button"
                      className={
                        profile === 'tutor'
                          ? 'chosen'
                          : ''
                      }
                      onClick={() => setProfile('tutor')}
                    >
                      <PawPrint size={20} />
                      Sou tutor
                    </button>

                    <button
                      type="button"
                      className={
                        profile === 'clinica'
                          ? 'chosen'
                          : ''
                      }
                      onClick={() => setProfile('clinica')}
                    >
                      <Users size={20} />
                      Profissional da clínica
                    </button>
                  </div>

                  <label>
                    E-mail
                    <input
                      type="email"
                      value={email}
                      onChange={e =>
                        setEmail(e.target.value)
                      }
                      placeholder="seuemail@exemplo.com"
                      autoComplete="username"
                      required
                    />
                  </label>

                  <label>
                    Senha
                    <div className="password-wrap">
                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={e =>
                          setPassword(e.target.value)
                        }
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(x => !x)
                        }
                        aria-label={
                          showPassword
                            ? 'Ocultar senha'
                            : 'Mostrar senha'
                        }
                      >
                        {showPassword
                          ? <EyeOff size={20} />
                          : <Eye size={20} />}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="primary"
                  >
                    Entrar no sistema
                  </button>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigate('recover')}
                  >
                    Esqueci minha senha
                  </button>

                  {profile === 'tutor' && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => navigate('register')}
                    >
                      Criar conta de tutor
                    </button>
                  )}

                </form>
              )}

              {/* CADASTRO DE TUTOR */}
              {screen === 'register' && (
                <form onSubmit={register}>

                  <p>
                    Preencha seus dados para criar
                    uma conta na VetRP.
                  </p>

                  <label>
                    Nome completo
                    <input
                      type="text"
                      name="nome"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    E-mail
                    <input
                      type="email"
                      name="email"
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label>
                    Telefone
                    <input
                      type="tel"
                      name="telefone"
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      required
                    />
                  </label>

                  <label>
                    Senha
                    <input
                      type="password"
                      name="senha"
                      placeholder="Crie uma senha segura"
                      autoComplete="new-password"
                      minLength={10}
                      required
                    />
                  </label>

                  <p className="password-hint">
                    A senha precisa ter no mínimo
                    10 caracteres, uma letra maiúscula,
                    uma minúscula, um número e um símbolo.
                  </p>

                  <h2>Endereço</h2>

                  <div className="form-grid">

                    <label>
                      CEP
                      <input
                        type="text"
                        name="cep"
                        value={address.cep}
                        onChange={e =>
                          changeAddress(
                            'cep',
                            e.target.value
                          )
                        }
                        placeholder="00000-000"
                        autoComplete="postal-code"
                        required
                      />
                    </label>

                    <label>
                      Rua
                      <input
                        type="text"
                        name="rua"
                        value={address.rua}
                        onChange={e =>
                          changeAddress(
                            'rua',
                            e.target.value
                          )
                        }
                        autoComplete="address-line1"
                        required
                      />
                    </label>

                    <label>
                      Número
                      <input
                        type="text"
                        name="numero"
                        value={address.numero}
                        onChange={e =>
                          changeAddress(
                            'numero',
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Complemento
                      <input
                        type="text"
                        name="complemento"
                        value={address.complemento}
                        onChange={e =>
                          changeAddress(
                            'complemento',
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Bairro
                      <input
                        type="text"
                        name="bairro"
                        value={address.bairro}
                        onChange={e =>
                          changeAddress(
                            'bairro',
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Cidade
                      <input
                        type="text"
                        name="cidade"
                        value={address.cidade}
                        onChange={e =>
                          changeAddress(
                            'cidade',
                            e.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Estado (UF)
                      <input
                        type="text"
                        name="uf"
                        value={address.uf}
                        onChange={e =>
                          changeAddress(
                            'uf',
                            e.target.value.toUpperCase()
                          )
                        }
                        maxLength={2}
                        placeholder="SP"
                        required
                      />
                    </label>

                  </div>

                  {cepStatus && (
                    <p role="status">
                      {cepStatus}
                    </p>
                  )}

                  <label className="privacy-consent">
                    <input type="checkbox" required />
                    <span>
                      Li e concordo com a{' '}
                      <a href="/privacidade.html" target="_blank" rel="noopener noreferrer">
                        Política de Privacidade
                      </a>
                      .
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="primary"
                  >
                    Criar minha conta
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => navigate('login')}
                  >
                    Já tenho uma conta
                  </button>

                </form>
              )}

              {/* RECUPERAÇÃO DE SENHA */}
              {screen === 'recover' && (
                <div>
                  <p>
                    Para recuperar o acesso à sua
                    conta, entre em contato com
                    a clínica e solicite orientação
                    para redefinir sua senha.
                  </p>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => navigate('login')}
                  >
                    <ArrowLeft size={18} />
                    Voltar ao login
                  </button>
                </div>
              )}

              {/* MENSAGENS DO SISTEMA */}
              {notice && (
                <p role="status" className="notice">
                  {notice}
                </p>
              )}

            </section>
          </main>
        </div>
      )}


      {/* ÁREA INTERNA DO VETRP */}
      {user && (
        <div className="workspace">

          {/* MENU LATERAL */}
          <aside
            className={`sidebar ${
              mobileMenuOpen ? 'menu-open' : ''
            }`}
          >
            <img
              className="sidebar-logo"
              src={logo}
              alt="VetRP — Clínica Veterinária"
            />

            {/* PERFIL DO USUÁRIO */}
            <button
              type="button"
              className="sidebar-profile"
              onClick={openProfile}
              aria-label="Abrir meu perfil"
            >
              <span className="sidebar-avatar">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto de perfil"
                  />
                ) : (
                  <span>
                    {user.nome
                      ?.trim()
                      .charAt(0)
                      .toUpperCase() || 'U'}
                  </span>
                )}
              </span>

              <span className="sidebar-profile-info">
                <strong>{user.nome}</strong>

                <small>
                  {isClinic
                    ? 'Profissional da clínica'
                    : 'Tutor(a)'}
                </small>

                <span className="sidebar-profile-link">
                  Ver meu perfil
                </span>
              </span>
            </button>

            <p className="section-label">
              {isClinic
                ? 'ÁREA DA CLÍNICA'
                : 'ÁREA DO TUTOR'}
            </p>

            {/* NAVEGAÇÃO */}
            <nav aria-label="Menu principal">
              {navigation.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    screen === id ? 'active' : ''
                  }
                  onClick={() => {
                    if (id === 'newpet') {
                      startNewPet();
                    } else {
                      navigate(id);

                      if (id === 'employees') {
                        loadEmployees();
                      }

                      if (id === 'reports') {
                        loadReport();
                      }
                    }
                  }}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* SAIR */}
            <div className="sidebar-logout">
              <button
                type="button"
                onClick={() => {
                  setUser(null);
                  setAuthorization(null);
                  setPets([]);
                  setAppointments([]);
                  setPersonal(null);
                  setAvatar('');
                  setPassword('');
                  navigate('home');
                }}
              >
                <LogOut size={18} />
                Sair do sistema
              </button>
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <div className="workspace-main">

            {/* CABEÇALHO */}
            <header className="workspace-top">

              <button
                type="button"
                className="mobile-menu-button"
                onClick={() =>
                  setMobileMenuOpen(x => !x)
                }
                aria-expanded={mobileMenuOpen}
              >
                <Users size={20} />
                Menu
              </button>

              <div className="top-user">

                <button
                  type="button"
                  className="top-profile-button"
                  onClick={openProfile}
                  aria-label="Acessar meu perfil"
                >
                  <span className="top-avatar">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Foto de perfil"
                      />
                    ) : (
                      user.nome
                        ?.trim()
                        .charAt(0)
                        .toUpperCase() || 'U'
                    )}
                  </span>

                  <span className="top-user-info">
                    <strong>{user.nome}</strong>

                    <small>
                      {isClinic
                        ? 'Área da clínica'
                        : 'Área do tutor'}
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className="top-logout"
                  onClick={() => {
                    setUser(null);
                    setAuthorization(null);
                    setPets([]);
                    setAppointments([]);
                    setPersonal(null);
                    setAvatar('');
                    setPassword('');
                    navigate('home');
                  }}
                >
                  <LogOut size={18} />
                  Sair
                </button>

              </div>
            </header>

            {/* CONTEÚDO DAS TELAS */}
            <main className="workspace-content">

              {/* MENSAGENS */}
              {notice && (
                <p role="status" className="notice">
                  {notice}
                </p>
              )}


              {/* PAINEL DE GESTÃO DA CLÍNICA */}
              {isClinic && screen === 'dashboard' && (
                <section className="clinic-dashboard">
                  <div className="heading">
                    <div>
                      <span className="public-eyebrow">PAINEL DA EQUIPE</span>
                      <h1>Visão geral da VetRP</h1>
                      <p>Agenda e indicadores atualizados automaticamente a cada 30 segundos.</p>
                      <small>Última atualização: {lastSync || 'Carregando...'}</small>
                    </div>
                    <button className="primary compact" type="button" onClick={() => navigate('agenda')}>
                      <CalendarDays size={18} /> Abrir agenda
                    </button>
                  </div>
                  <div className="dashboard-metrics">
                    <article className="dashboard-metric">
                      <small>Cancelamentos · semana passada</small>
                      <strong>{dashboard.semanaAnterior?.cancelamentos ?? '—'}</strong>
                      <span>De segunda a domingo</span>
                    </article>
                    <article className="dashboard-metric">
                      <small>Consultas · mês passado</small>
                      <strong>{dashboard.mesAnterior?.consultas ?? '—'}</strong>
                      <span>Registros no período</span>
                    </article>
                    <article className="dashboard-metric">
                      <small>Urgências · mês passado</small>
                      <strong>{dashboard.mesAnterior?.urgencias ?? '—'}</strong>
                      <span>Registros classificados como urgência</span>
                    </article>
                    <article className="dashboard-metric">
                      <small>Exames · mês passado</small>
                      <strong>{dashboard.mesAnterior?.exames ?? '—'}</strong>
                      <span>Registros no período</span>
                    </article>
                  </div>
                  <div className="dashboard-bottom">
                    <div className="panel dashboard-chart-panel">
                      <h2>Atendimentos do mês passado</h2>
                      <p>Distribuição dos tipos de atendimento</p>
                      {(() => {
                        const r = dashboard.mesAnterior;
                        const values = [Number(r?.consultas || 0), Number(r?.exames || 0), Number(r?.cirurgias || 0), Number(r?.urgencias || 0)];
                        const total = values.reduce((sum, n) => sum + n, 0);
                        const degrees = values.map(v => total ? v * 360 / total : 0);
                        const a = degrees[0], b = a + degrees[1], c = b + degrees[2];
                        return <div className="dashboard-chart-layout">
                          <div className="dashboard-donut" role="img" aria-label={`Consultas ${values[0]}, exames ${values[1]}, cirurgias ${values[2]}, urgências ${values[3]}`}
                            style={{background: total ? `conic-gradient(#176c69 0deg ${a}deg, #5bb7a3 ${a}deg ${b}deg, #e8a55a ${b}deg ${c}deg, #8b86cf ${c}deg 360deg)` : '#e6ecea'}}>
                            <div><strong>{total}</strong><small>atendimentos</small></div>
                          </div>
                          <div className="dashboard-legend">
                            {['Consultas', 'Exames', 'Cirurgias', 'Urgências'].map((name, i) => <div key={name}>
                              <span className={`legend-dot legend-dot-${i}`} /> <span>{name}</span> <strong>{values[i]}</strong>
                            </div>)}
                          </div>
                        </div>;
                      })()}
                    </div>
                    <div className="panel dashboard-agenda-panel">
                      <h2>Agenda de hoje</h2>
                      <p>Agendamentos do dia {formatDate(today())}</p>
                      {appointments.filter(a => String(a.data || a.horario?.data || '').slice(0, 10) === today()).length === 0
                        ? <p>Nenhum agendamento para hoje.</p>
                        : <div className="dashboard-today-list">
                          {appointments.filter(a => String(a.data || a.horario?.data || '').slice(0, 10) === today())
                            .sort((a,b) => String(a.hora || '').localeCompare(String(b.hora || '')))
                            .map(a => <div key={a.id}>
                              <strong>{a.hora || a.horario?.hora || '—'}</strong>
                              <span>{a.pet || a.animal?.nome || 'Paciente'} · {a.tipo || 'Atendimento'}</span>
                              <small>{a.status || 'Agendado'}</small>
                            </div>)}
                        </div>}
                      <button type="button" className="secondary" onClick={() => navigate('agenda')}>Ver agenda completa</button>
                    </div>
                  </div>
                  <p className="dashboard-footnote">Indicadores baseados nos agendamentos registrados no banco de dados. Não representam necessariamente procedimentos realizados.</p>
                </section>
              )}

              {/* MEU PERFIL */}
              {screen === 'personal' && (
                <section className="personal-page">

                  <div className="heading">
                    <div>
                      <h1>Meu perfil</h1>
                      <p>
                        Consulte e atualize suas
                        informações pessoais.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() =>
                        navigate(
                          isClinic ? 'agenda' : 'pets'
                        )
                      }
                    >
                      <ArrowLeft size={18} />
                      Voltar
                    </button>
                  </div>

                  <div className="panel personal-panel">

                    {/* FOTO E IDENTIFICAÇÃO */}
                    <div className="personal-profile-header">

                      <div className="personal-avatar">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Minha foto de perfil"
                          />
                        ) : (
                          <span>
                            {user.nome
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      <div className="personal-profile-details">
                        <h2>{user.nome}</h2>

                        <p>
                          {isClinic
                            ? 'Profissional da clínica'
                            : 'Tutor(a) cadastrado(a)'}
                        </p>

                        <label
                          htmlFor="profile-photo"
                          className="personal-photo-label"
                        >
                          Alterar foto de perfil
                        </label>

                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          onChange={changeAvatar}
                          className="personal-photo-input"
                        />

                        <small>
                          Imagem de até 2 MB.
                          A foto é temporária e não
                          fica salva após sair.
                        </small>
                      </div>
                    </div>

                    <div className="personal-divider" />

                    {personalLoading ? (
                      <p>Carregando seus dados...</p>
                    ) : !personal ? (
                      <div>
                        <p>
                          Não foi possível apresentar
                          seus dados pessoais.
                        </p>

                        <button
                          type="button"
                          className="secondary"
                          onClick={loadPersonal}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : !editingPersonal ? (
                      <>
                        {/* VISUALIZAÇÃO DOS DADOS */}
                        <div className="personal-section-heading">
                          <h2>Informações pessoais</h2>

                          <button
                            type="button"
                            className="primary"
                            onClick={() =>
                              setEditingPersonal(true)
                            }
                          >
                            Editar informações
                          </button>
                        </div>

                        <div className="info-grid">
                          <div>
                            <small>Nome completo</small>
                            <strong>
                              {personal.nome || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>E-mail</small>
                            <strong>
                              {personal.email || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Telefone</small>
                            <strong>
                              {personal.telefone || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Perfil de acesso</small>
                            <strong>
                              {user.perfil === 'TUTOR'
                                ? 'Tutor'
                                : user.perfil === 'ADMIN'
                                  ? 'Administrador'
                                  : 'Funcionário'}
                            </strong>
                          </div>
                        </div>

                        <h2>Endereço</h2>

                        <div className="info-grid">
                          <div>
                            <small>CEP</small>
                            <strong>
                              {personal.cep || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Rua</small>
                            <strong>
                              {personal.rua || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Número</small>
                            <strong>
                              {personal.numero || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Complemento</small>
                            <strong>
                              {personal.complemento || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Bairro</small>
                            <strong>
                              {personal.bairro || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Cidade</small>
                            <strong>
                              {personal.cidade || '—'}
                            </strong>
                          </div>

                          <div>
                            <small>Estado</small>
                            <strong>
                              {personal.uf || '—'}
                            </strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* EDIÇÃO DOS DADOS */
                      <form onSubmit={savePersonal}>

                        <h2>Editar informações pessoais</h2>

                        <div className="form-grid">

                          <label>
                            Nome completo
                            <input
                              type="text"
                              value={personalForm.nome || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  nome: e.target.value
                                }))
                              }
                              required
                            />
                          </label>

                          <label>
                            E-mail
                            <input
                              type="email"
                              value={personalForm.email || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  email: e.target.value
                                }))
                              }
                              required
                            />
                          </label>

                          <label>
                            Telefone
                            <input
                              type="tel"
                              value={personalForm.telefone || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  telefone: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            CEP
                            <input
                              type="text"
                              value={personalForm.cep || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  cep: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Rua
                            <input
                              type="text"
                              value={personalForm.rua || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  rua: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Número
                            <input
                              type="text"
                              value={personalForm.numero || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  numero: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Complemento
                            <input
                              type="text"
                              value={
                                personalForm.complemento || ''
                              }
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  complemento: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Bairro
                            <input
                              type="text"
                              value={personalForm.bairro || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  bairro: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Cidade
                            <input
                              type="text"
                              value={personalForm.cidade || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  cidade: e.target.value
                                }))
                              }
                            />
                          </label>

                          <label>
                            Estado (UF)
                            <input
                              type="text"
                              maxLength={2}
                              value={personalForm.uf || ''}
                              onChange={e =>
                                setPersonalForm(prev => ({
                                  ...prev,
                                  uf: e.target.value.toUpperCase()
                                }))
                              }
                            />
                          </label>

                        </div>

                        <div className="actions">
                          <button
                            type="submit"
                            className="primary"
                          >
                            Salvar alterações
                          </button>

                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              setEditingPersonal(false);
                              loadPersonal();
                            }}
                          >
                            Cancelar
                          </button>
                        </div>

                      </form>
                    )}

                  </div>
                </section>
              )}


              {/* MEUS ANIMAIS */}
              {!isClinic && screen === 'pets' && (
                <section className="pets-page">

                  <div className="heading">
                    <div>
                      <h1>Meus animais</h1>
                      <p>
                        Consulte e gerencie os animais
                        cadastrados na sua conta.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="primary compact"
                      onClick={startNewPet}
                    >
                      <Plus size={19} />
                      Cadastrar animal
                    </button>
                  </div>

                  {pets.length === 0 ? (
                    <div className="panel pets-empty">
                      <PawPrint size={52} />

                      <h2>Nenhum animal cadastrado</h2>

                      <p>
                        Cadastre seu primeiro pet para
                        organizar suas informações e
                        realizar agendamentos.
                      </p>

                      <button
                        type="button"
                        className="primary"
                        onClick={startNewPet}
                      >
                        <Plus size={18} />
                        Cadastrar meu pet
                      </button>
                    </div>
                  ) : (
                    <div className="two-col">

                      {/* LISTA DE ANIMAIS */}
                      <div className="panel stack">
                        <h2>Seus pets</h2>

                        {pets.map(animal => (
                          <button
                            key={animal.id}
                            type="button"
                            className={
                              'pet-item ' +
                              (current?.id === animal.id
                                ? 'active'
                                : '')
                            }
                            onClick={() =>
                              setSelected(animal.id)
                            }
                          >
                            <span className="pet-item-icon">
                              <PawPrint size={24} />
                            </span>

                            <span>
                              <strong>{animal.nome}</strong>

                              <small>
                                {animal.especie || 'Animal'}
                                {animal.raca
                                  ? ` • ${animal.raca}`
                                  : ''}
                              </small>
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* INFORMAÇÕES DO ANIMAL */}
                      {current && (
                        <div className="panel pet-details">

                          <div className="pet-details-header">
                            <div className="pet-details-avatar">
                              <PawPrint size={38} />
                            </div>

                            <div>
                              <span className="public-eyebrow">
                                INFORMAÇÕES DO PET
                              </span>

                              <h2>{current.nome}</h2>

                              <p>
                                {current.especie || 'Animal'}
                                {current.raca
                                  ? ` • ${current.raca}`
                                  : ''}
                              </p>
                            </div>
                          </div>

                          <div className="personal-divider" />

                          <h3>Dados do animal</h3>

                          <div className="info-grid">

                            <div>
                              <small>Nome</small>
                              <strong>
                                {current.nome || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Espécie</small>
                              <strong>
                                {current.especie || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Raça</small>
                              <strong>
                                {current.raca || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Sexo</small>
                              <strong>
                                {current.sexo || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Data de nascimento</small>
                              <strong>
                                {formatDate(current.nascimento)}
                              </strong>
                            </div>

                            <div>
                              <small>Peso</small>
                              <strong>
                                {current.peso != null &&
                                current.peso !== ''
                                  ? `${current.peso} kg`
                                  : '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Pelagem</small>
                              <strong>
                                {current.pelagem || '—'}
                              </strong>
                            </div>

                          </div>

                          <div className="note">
                            <h3>Observações</h3>

                            <p>
                              {current.observacoes ||
                                'Nenhuma observação cadastrada.'}
                            </p>
                          </div>

                          <div className="actions">

                            <button
                              type="button"
                              className="primary compact"
                              onClick={() => editPet(current)}
                            >
                              Editar informações
                            </button>

                            <button
                              type="button"
                              className="secondary compact"
                              onClick={() => {
                                setBooking(previous => ({
                                  ...previous,
                                  pet: String(current.id),
                                  tipo: 'Consulta',
                                  data: '',
                                  hora: ''
                                }));

                                navigate('consult');
                              }}
                            >
                              <CalendarDays size={18} />
                              Agendar consulta
                            </button>

                            <button
                              type="button"
                              className="secondary compact"
                              onClick={() => {
                                setBooking(previous => ({
                                  ...previous,
                                  pet: String(current.id),
                                  tipo: 'Exame',
                                  data: '',
                                  hora: ''
                                }));

                                navigate('exam');
                              }}
                            >
                              <FlaskConical size={18} />
                              Agendar exame
                            </button>

                          </div>

                        </div>
                      )}

                    </div>
                  )}

                </section>
              )}


              {/* CADASTRO E EDIÇÃO DE ANIMAIS */}
              {!isClinic && screen === 'newpet' && (
                <section className="pet-form-page">

                  <div className="heading">
                    <div>
                      <h1>
                        {editingPetId !== null
                          ? 'Editar animal'
                          : 'Cadastrar animal'}
                      </h1>

                      <p>
                        {editingPetId !== null
                          ? 'Atualize as informações do seu pet.'
                          : 'Preencha as informações para cadastrar seu pet.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => {
                        setEditingPetId(null);
                        navigate('pets');
                      }}
                    >
                      <ArrowLeft size={18} />
                      Voltar
                    </button>
                  </div>

                  <div className="panel pet-form-panel">

                    <div className="pet-form-intro">
                      <div className="pet-form-icon">
                        <PawPrint size={32} />
                      </div>

                      <div>
                        <h2>Informações do animal</h2>

                        <p>
                          Mantenha os dados do seu
                          pet sempre atualizados.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={savePet}>

                      <div className="form-grid">

                        {/* NOME */}
                        <label>
                          Nome do animal

                          <input
                            type="text"
                            value={petForm.nome}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                nome: e.target.value
                              }))
                            }
                            placeholder="Ex.: Amora"
                            maxLength={100}
                            required
                          />
                        </label>

                        {/* ESPÉCIE */}
                        <label>
                          Espécie

                          <select
                            value={petForm.especie}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                especie: e.target.value
                              }))
                            }
                            required
                          >
                            <option value="Canina">
                              Cachorro
                            </option>

                            <option value="Felina">
                              Gato
                            </option>

                            <option value="Ave">
                              Ave
                            </option>

                            <option value="Roedor">
                              Roedor
                            </option>

                            <option value="Outra">
                              Outra
                            </option>
                          </select>
                        </label>

                        {/* RAÇA */}
                        <label>
                          Raça

                          <input
                            type="text"
                            value={petForm.raca}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                raca: e.target.value
                              }))
                            }
                            placeholder="Ex.: Shih-tzu ou SRD"
                          />
                        </label>

                        {/* SEXO */}
                        <label>
                          Sexo

                          <select
                            value={petForm.sexo}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                sexo: e.target.value
                              }))
                            }
                            required
                          >
                            <option value="Fêmea">
                              Fêmea
                            </option>

                            <option value="Macho">
                              Macho
                            </option>
                          </select>
                        </label>

                        {/* NASCIMENTO */}
                        <label>
                          Data de nascimento

                          <input
                            type="date"
                            value={petForm.nascimento}
                            max={today()}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                nascimento: e.target.value
                              }))
                            }
                          />
                        </label>

                        {/* PESO */}
                        <label>
                          Peso (kg)

                          <input
                            type="number"
                            min="0.01"
                            max="500"
                            step="0.01"
                            value={petForm.peso}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                peso: e.target.value
                              }))
                            }
                            placeholder="Ex.: 4.50"
                          />
                        </label>

                        {/* PELAGEM */}
                        <label className="full">
                          Pelagem

                          <input
                            type="text"
                            value={petForm.pelagem}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                pelagem: e.target.value
                              }))
                            }
                            placeholder="Ex.: Curta, branca e marrom"
                          />
                        </label>

                        {/* OBSERVAÇÕES */}
                        <label className="full">
                          Observações

                          <textarea
                            rows={5}
                            value={petForm.observacoes}
                            onChange={e =>
                              setPetForm(previous => ({
                                ...previous,
                                observacoes: e.target.value
                              }))
                            }
                            placeholder="Informações importantes sobre o animal..."
                          />
                        </label>

                      </div>

                      {/* BOTÕES */}
                      <div className="actions">

                        <button
                          type="submit"
                          className="primary compact"
                        >
                          <PawPrint size={19} />

                          {editingPetId !== null
                            ? 'Salvar alterações'
                            : 'Cadastrar animal'}
                        </button>

                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setEditingPetId(null);
                            setPetForm(emptyPetForm());
                            navigate('pets');
                          }}
                        >
                          Cancelar
                        </button>

                      </div>

                    </form>

                  </div>

                </section>
              )}


              {/* AGENDAR CONSULTA OU EXAME */}
              {!isClinic &&
                (screen === 'consult' || screen === 'exam') && (
                  <section className="booking-page">

                    <div className="heading">
                      <div>
                        <h1>
                          {screen === 'consult'
                            ? 'Agendar consulta'
                            : 'Agendar exame'}
                        </h1>

                        <p>
                          Escolha seu animal, a data e
                          um horário disponível.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="secondary compact"
                        onClick={() => navigate('pets')}
                      >
                        <ArrowLeft size={18} />
                        Voltar
                      </button>
                    </div>

                    <div className="panel booking-panel">

                      <div className="pet-form-intro">
                        <div className="pet-form-icon">
                          {screen === 'consult' ? (
                            <CalendarDays size={30} />
                          ) : (
                            <FlaskConical size={30} />
                          )}
                        </div>

                        <div>
                          <h2>Informações do agendamento</h2>

                          <p>
                            Preencha os dados para
                            solicitar seu atendimento.
                          </p>
                        </div>
                      </div>

                      {pets.length === 0 ? (
                        <div className="note">
                          <h3>Cadastre um animal primeiro</h3>

                          <p>
                            Para realizar um agendamento,
                            você precisa ter pelo menos
                            um animal cadastrado.
                          </p>

                          <button
                            type="button"
                            className="primary"
                            onClick={startNewPet}
                          >
                            <Plus size={18} />
                            Cadastrar animal
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={saveBooking}>

                          <div className="form-grid">

                            {/* ANIMAL */}
                            <label>
                              Animal

                              <select
                                value={booking.pet}
                                onChange={e =>
                                  setBooking(previous => ({
                                    ...previous,
                                    pet: e.target.value
                                  }))
                                }
                                required
                              >
                                <option value="">
                                  Selecione seu animal
                                </option>

                                {pets.map(animal => (
                                  <option
                                    key={animal.id}
                                    value={animal.id}
                                  >
                                    {animal.nome}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {/* TIPO */}
                            <label>
                              Tipo de atendimento

                              <select
                                value={
                                  screen === 'consult'
                                    ? 'Consulta'
                                    : 'Exame'
                                }
                                disabled
                              >
                                <option
                                  value={
                                    screen === 'consult'
                                      ? 'Consulta'
                                      : 'Exame'
                                  }
                                >
                                  {screen === 'consult'
                                    ? 'Consulta veterinária'
                                    : 'Exame veterinário'}
                                </option>
                              </select>
                            </label>

                            {/* DATA */}
                            <label>
                              Data do atendimento

                              <input
                                type="date"
                                min={today()}
                                value={booking.data}
                                onChange={e =>
                                  setBooking(previous => ({
                                    ...previous,
                                    data: e.target.value,
                                    hora: ''
                                  }))
                                }
                                required
                              />
                            </label>

                            {/* PROFISSIONAL */}
                            <label>
                              Profissional

                              <input
                                type="text"
                                value={booking.profissional}
                                onChange={e => setBooking(previous => ({
                                  ...previous,
                                  profissional: e.target.value
                                }))}
                                placeholder="Profissional (se informado pela clínica)"
                              />
                            </label>

                            {/* MOTIVO */}
                            <label className="full">
                              Motivo do atendimento

                              <textarea
                                rows={4}
                                value={booking.motivo}
                                onChange={e =>
                                  setBooking(previous => ({
                                    ...previous,
                                    motivo: e.target.value
                                  }))
                                }
                                placeholder={
                                  screen === 'consult'
                                    ? 'Descreva brevemente o motivo da consulta...'
                                    : 'Informe qual exame foi solicitado...'
                                }
                              />
                            </label>

                          </div>

                          {/* HORÁRIOS DISPONÍVEIS */}
                          <div className="booking-slots-section">

                            <h2>Horários disponíveis</h2>

                            {!booking.data ? (
                              <p>
                                Selecione uma data para
                                consultar os horários.
                              </p>
                            ) : availableSlots.length === 0 ? (
                              <div className="note">
                                <p>
                                  Nenhum horário disponível
                                  foi encontrado para
                                  esta data.
                                </p>
                              </div>
                            ) : (
                              <div className="slot-grid">
                                {availableSlots.map(slot => {
                                  const slotId =
                                    typeof slot === 'object'
                                      ? slot.id
                                      : slot;

                                  const slotTime =
                                    typeof slot === 'object'
                                      ? (
                                          slot.hora ||
                                          slot.horario ||
                                          slot.inicio ||
                                          String(slot.id)
                                        )
                                      : String(slot);

                                  return (
                                    <button
                                      key={slotId}
                                      type="button"
                                      className={
                                        String(booking.hora) ===
                                        String(slotId)
                                          ? 'chosen'
                                          : ''
                                      }
                                      onClick={() =>
                                        setBooking(previous => ({
                                          ...previous,
                                          hora: String(slotId)
                                        }))
                                      }
                                    >
                                      {slotTime}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                          </div>

                          {/* RESUMO */}
                          <div className="note">
                            <h3>Resumo do agendamento</h3>

                            <p>
                              <strong>Animal: </strong>
                              {pets.find(
                                animal =>
                                  String(animal.id) ===
                                  String(booking.pet)
                              )?.nome || 'Não selecionado'}
                            </p>

                            <p>
                              <strong>Atendimento: </strong>
                              {screen === 'consult'
                                ? 'Consulta'
                                : 'Exame'}
                            </p>

                            <p>
                              <strong>Data: </strong>
                              {booking.data
                                ? formatDate(booking.data)
                                : 'Não selecionada'}
                            </p>

                            <p>
                              <strong>Profissional: </strong>
                              {booking.profissional}
                            </p>
                          </div>

                          {/* BOTÕES */}
                          <div className="actions">
                            <button
                              type="submit"
                              className="primary compact"
                              disabled={
                                !booking.pet ||
                                !booking.data ||
                                !booking.hora
                              }
                            >
                              <CalendarDays size={19} />
                              Confirmar agendamento
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                navigate('pets')
                              }
                            >
                              Cancelar
                            </button>
                          </div>

                        </form>
                      )}

                    </div>
                  </section>
                )}


              {/* MEUS AGENDAMENTOS */}
              {!isClinic && screen === 'bookings' && (
                <section className="bookings-page">

                  <div className="heading">
                    <div>
                      <h1>Meus agendamentos</h1>
                      <p>
                        Acompanhe suas consultas e exames
                        agendados na VetRP.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="primary compact"
                      onClick={() => {
                        setBooking(previous => ({
                          ...previous,
                          tipo: 'Consulta',
                          data: '',
                          hora: ''
                        }));

                        navigate('consult');
                      }}
                    >
                      <Plus size={19} />
                      Novo agendamento
                    </button>
                  </div>

                  {/* RESUMO */}
                  <div className="stats">
                    <div>
                      <small>Total de agendamentos</small>
                      <strong>{appointments.length}</strong>
                    </div>

                    <div>
                      <small>Agendamentos ativos</small>
                      <strong>
                        {appointments.filter(item =>
                          !['CANCELADO', 'CANCELADA'].includes(
                            String(item.status || '').toUpperCase()
                          )
                        ).length}
                      </strong>
                    </div>

                    <div>
                      <small>Cancelados</small>
                      <strong>
                        {appointments.filter(item =>
                          ['CANCELADO', 'CANCELADA'].includes(
                            String(item.status || '').toUpperCase()
                          )
                        ).length}
                      </strong>
                    </div>
                  </div>

                  {/* LISTA */}
                  {appointments.length === 0 ? (
                    <div className="panel bookings-empty">
                      <CalendarDays size={52} />

                      <h2>Nenhum agendamento encontrado</h2>

                      <p>
                        Você ainda não possui consultas
                        ou exames agendados.
                      </p>

                      <button
                        type="button"
                        className="primary"
                        onClick={() => { setBooking(previous => ({ ...previous, tipo: 'Consulta', hora: '' })); navigate('consult'); }}
                      >
                        Agendar consulta
                      </button>
                    </div>
                  ) : (
                    <div className="panel bookings-panel">

                      <div className="bookings-panel-header">
                        <div>
                          <h2>Histórico de atendimentos</h2>
                          <p>
                            Consulte os detalhes dos
                            seus agendamentos.
                          </p>
                        </div>
                      </div>

                      <div className="table-scroll">
                        <table className="bookings-table">
                          <thead>
                            <tr>
                              <th>Animal</th>
                              <th>Atendimento</th>
                              <th>Data</th>
                              <th>Horário</th>
                              <th>Profissional</th>
                              <th>Status</th>
                              <th>Ações</th>
                            </tr>
                          </thead>

                          <tbody>
                            {appointments.map(item => {
                              const status = String(
                                item.status || 'AGENDADO'
                              ).toUpperCase();

                              const cancelled = [
                                'CANCELADO',
                                'CANCELADA'
                              ].includes(status);

                              const finished = [
                                'CONCLUIDO',
                                'CONCLUÍDO',
                                'REALIZADO',
                                'FINALIZADO'
                              ].includes(status);

                              const animalName =
                                item.animalNome ||
                                item.nomeAnimal ||
                                item.animal?.nome ||
                                pets.find(
                                  pet =>
                                    String(pet.id) ===
                                    String(item.animalId)
                                )?.nome ||
                                '—';

                              const appointmentDate =
                                item.data ||
                                item.dataAgendamento ||
                                item.horario?.data ||
                                '';

                              const appointmentTime =
                                item.hora ||
                                item.horario?.hora ||
                                item.horarioInicio ||
                                '';

                              return (
                                <tr key={item.id}>

                                  <td>
                                    <strong>
                                      {animalName}
                                    </strong>
                                  </td>

                                  <td>
                                    {item.tipo || 'Consulta'}
                                  </td>

                                  <td>
                                    {appointmentDate
                                      ? formatDate(
                                          String(
                                            appointmentDate
                                          ).slice(0, 10)
                                        )
                                      : '—'}
                                  </td>

                                  <td>
                                    {appointmentTime
                                      ? String(
                                          appointmentTime
                                        ).slice(0, 5)
                                      : '—'}
                                  </td>

                                  <td>
                                    {item.profissional || '—'}
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        'booking-status ' +
                                        (cancelled
                                          ? 'status-cancelled'
                                          : finished
                                            ? 'status-finished'
                                            : 'status-active')
                                      }
                                    >
                                      {status}
                                    </span>
                                  </td>

                                  <td>
                                    {!cancelled && !finished ? (
                                      <button
                                        type="button"
                                        className="secondary compact"
                                        onClick={() =>
                                          cancelBooking(item.id)
                                        }
                                      >
                                        Cancelar
                                      </button>
                                    ) : (
                                      <small>
                                        Sem ações
                                      </small>
                                    )}
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )}

                </section>
              )}


              {/* AGENDA DA CLÍNICA */}
              {isClinic && screen === 'agenda' && (
                <section className="clinic-agenda-page">

                  <div className="heading">
                    <div>
                      <h1>Agenda da clínica</h1>
                      <p>
                        Consulte e organize os atendimentos
                        agendados na VetRP.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={refresh}
                    >
                      Atualizar agenda
                    </button>
                  </div>

                  {/* INDICADORES */}
                  <div className="stats">

                    <div>
                      <small>Total de agendamentos</small>
                      <strong>{appointments.length}</strong>
                    </div>

                    <div>
                      <small>Consultas</small>
                      <strong>
                        {appointments.filter(item =>
                          String(item.tipo || '')
                            .toLowerCase()
                            .includes('consulta')
                        ).length}
                      </strong>
                    </div>

                    <div>
                      <small>Exames</small>
                      <strong>
                        {appointments.filter(item =>
                          String(item.tipo || '')
                            .toLowerCase()
                            .includes('exame')
                        ).length}
                      </strong>
                    </div>

                    <div>
                      <small>Cancelados</small>
                      <strong>
                        {appointments.filter(item =>
                          ['CANCELADO', 'CANCELADA'].includes(
                            String(item.status || '')
                              .toUpperCase()
                          )
                        ).length}
                      </strong>
                    </div>

                  </div>

                  {/* FILTROS */}
                  <div className="panel agenda-filters">

                    <div className="agenda-filters-header">
                      <h2>Filtrar atendimentos</h2>
                      <p>
                        Pesquise por animal, tutor,
                        profissional ou tipo de atendimento.
                      </p>
                    </div>

                    <div className="form-grid">

                      <label>
                        Pesquisar

                        <input
                          type="search"
                          value={search}
                          onChange={e =>
                            setSearch(e.target.value)
                          }
                          placeholder="Digite um nome ou atendimento..."
                        />
                      </label>

                      <label>
                        Data

                        <input
                          type="date"
                          value={agendaDate}
                          onChange={e =>
                            setAgendaDate(e.target.value)
                          }
                        />
                      </label>

                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => {
                        setSearch('');
                        setAgendaDate('');
                      }}
                    >
                      Limpar filtros
                    </button>

                  </div>

                  {/* LISTA DE ATENDIMENTOS */}
                  <div className="panel clinic-agenda-panel">

                    <div className="bookings-panel-header">
                      <div>
                        <h2>Atendimentos agendados</h2>
                        <p>
                          Acompanhe a programação da clínica.
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const filteredAppointments =
                        appointments
                          .filter(item => {
                            const animalName =
                              item.animalNome ||
                              item.nomeAnimal ||
                              item.animal?.nome ||
                              '';

                            const tutorName =
                              item.tutorNome ||
                              item.nomeTutor ||
                              item.tutor?.nome ||
                              '';

                            const searchableText = [
                              animalName,
                              tutorName,
                              item.tipo,
                              item.profissional,
                              item.status
                            ]
                              .join(' ')
                              .toLowerCase();

                            const matchesSearch =
                              searchableText.includes(
                                search.trim().toLowerCase()
                              );

                            const appointmentDate =
                              item.data ||
                              item.dataAgendamento ||
                              item.horario?.data ||
                              '';

                            const matchesDate =
                              !agendaDate ||
                              String(appointmentDate)
                                .slice(0, 10) === agendaDate;

                            return matchesSearch && matchesDate;
                          })
                          .sort((a, b) => {
                            const dateA = String(
                              a.data ||
                              a.dataAgendamento ||
                              a.horario?.data ||
                              ''
                            );

                            const dateB = String(
                              b.data ||
                              b.dataAgendamento ||
                              b.horario?.data ||
                              ''
                            );

                            return dateA.localeCompare(dateB);
                          });

                      if (filteredAppointments.length === 0) {
                        return (
                          <div className="agenda-empty">
                            <CalendarDays size={48} />

                            <h3>Nenhum atendimento encontrado</h3>

                            <p>
                              Não há agendamentos que
                              correspondam aos filtros.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="table-scroll">

                          <table className="bookings-table">

                            <thead>
                              <tr>
                                <th>Animal</th>
                                <th>Tutor</th>
                                <th>Atendimento</th>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Profissional</th>
                                <th>Status</th>
                                <th>Ações</th>
                              </tr>
                            </thead>

                            <tbody>
                              {filteredAppointments.map(item => {
                                const status = String(
                                  item.status || 'AGENDADO'
                                ).toUpperCase();

                                const cancelled = [
                                  'CANCELADO',
                                  'CANCELADA'
                                ].includes(status);

                                const finished = [
                                  'CONCLUIDO',
                                  'CONCLUÍDO',
                                  'REALIZADO',
                                  'FINALIZADO'
                                ].includes(status);

                                const animalName =
                                  item.animalNome ||
                                  item.nomeAnimal ||
                                  item.animal?.nome ||
                                  '—';

                                const tutorName =
                                  item.tutorNome ||
                                  item.nomeTutor ||
                                  item.tutor?.nome ||
                                  '—';

                                const appointmentDate =
                                  item.data ||
                                  item.dataAgendamento ||
                                  item.horario?.data ||
                                  '';

                                const appointmentTime =
                                  item.hora ||
                                  item.horario?.hora ||
                                  item.horarioInicio ||
                                  '';

                                return (
                                  <tr key={item.id}>

                                    <td>
                                      <strong>
                                        {animalName}
                                      </strong>
                                    </td>

                                    <td>{tutorName}</td>

                                    <td>
                                      {item.tipo || 'Consulta'}
                                    </td>

                                    <td>
                                      {appointmentDate
                                        ? formatDate(
                                            String(appointmentDate)
                                              .slice(0, 10)
                                          )
                                        : '—'}
                                    </td>

                                    <td>
                                      {appointmentTime
                                        ? String(
                                            appointmentTime
                                          ).slice(0, 5)
                                        : '—'}
                                    </td>

                                    <td>
                                      {item.profissional || '—'}
                                    </td>

                                    <td>
                                      <span
                                        className={
                                          'booking-status ' +
                                          (cancelled
                                            ? 'status-cancelled'
                                            : finished
                                              ? 'status-finished'
                                              : 'status-active')
                                        }
                                      >
                                        {status}
                                      </span>
                                    </td>

                                    <td>
                                      {!cancelled && !finished ? (
                                        <button
                                          type="button"
                                          className="secondary compact"
                                          onClick={() =>
                                            cancelBooking(item.id)
                                          }
                                        >
                                          Cancelar
                                        </button>
                                      ) : (
                                        <small>Sem ações</small>
                                      )}
                                    </td>

                                  </tr>
                                );
                              })}
                            </tbody>

                          </table>

                        </div>
                      );
                    })()}

                  </div>

                </section>
              )}


              {/* GERENCIAMENTO DE HORÁRIOS */}
              {isClinic && screen === 'slots' && (
                <section className="clinic-slots-page">

                  <div className="heading">
                    <div>
                      <h1>Gerenciar horários</h1>
                      <p>
                        Cadastre e organize os horários
                        disponíveis para atendimento.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => navigate('agenda')}
                    >
                      <ArrowLeft size={18} />
                      Voltar à agenda
                    </button>
                  </div>

                  {/* CADASTRO DE HORÁRIOS */}
                  <div className="panel slots-form-panel">

                    <div className="pet-form-intro">
                      <div className="pet-form-icon">
                        <CalendarDays size={30} />
                      </div>

                      <div>
                        <h2>Disponibilizar horário</h2>
                        <p>
                          Defina a data, o horário e
                          o profissional responsável.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={saveSlot}>

                      <div className="form-grid">

                        <label>
                          Data do atendimento

                          <input
                            type="date"
                            min={today()}
                            value={slotForm.data || ''}
                            onChange={e =>
                              setSlotForm(previous => ({
                                ...previous,
                                data: e.target.value
                              }))
                            }
                            required
                          />
                        </label>

                        <label>
                          Horário

                          <input
                            type="time"
                            value={slotForm.hora || ''}
                            onChange={e =>
                              setSlotForm(previous => ({
                                ...previous,
                                hora: e.target.value
                              }))
                            }
                            required
                          />
                        </label>

                        <label>
                          Tipo de atendimento

                          <select
                            value={slotForm.tipo || 'Consulta'}
                            onChange={e =>
                              setSlotForm(previous => ({
                                ...previous,
                                tipo: e.target.value
                              }))
                            }
                            required
                          >
                            <option value="Consulta">
                              Consulta
                            </option>

                            <option value="Exame">
                              Exame
                            </option>
                          </select>
                        </label>

                        <label>
                          Profissional responsável

                          <input
                            type="text"
                            value={slotForm.profissional || ''}
                            onChange={e =>
                              setSlotForm(previous => ({
                                ...previous,
                                profissional: e.target.value
                              }))
                            }
                            placeholder="Nome do veterinário"
                            required
                          />
                        </label>

                      </div>

                      <div className="actions">
                        <button
                          type="submit"
                          className="primary compact"
                        >
                          <Plus size={19} />
                          Disponibilizar horário
                        </button>
                      </div>

                    </form>
                  </div>

                  {/* CONSULTAR HORÁRIOS */}
                  <div className="panel slots-list-panel">

                    <div className="bookings-panel-header">
                      <div>
                        <h2>Consultar horários</h2>
                        <p>
                          Selecione uma data para
                          visualizar a disponibilidade.
                        </p>
                      </div>
                    </div>

                    <div className="form-grid">
                      <label>
                        Data para consulta

                        <input
                          type="date"
                          min={today()}
                          value={booking.data || ''}
                          onChange={e =>
                            setBooking(previous => ({
                              ...previous,
                              data: e.target.value,
                              hora: ''
                            }))
                          }
                        />
                      </label>
                    </div>

                    {!booking.data ? (
                      <div className="agenda-empty">
                        <CalendarDays size={44} />

                        <h3>Selecione uma data</h3>
                        <p>
                          Os horários disponíveis
                          aparecerão aqui.
                        </p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="agenda-empty">
                        <CalendarDays size={44} />

                        <h3>Nenhum horário disponível</h3>
                        <p>
                          Não foram encontrados horários
                          livres para a data selecionada.
                        </p>
                      </div>
                    ) : (
                      <div className="table-scroll">

                        <table className="bookings-table">
                          <thead>
                            <tr>
                              <th>Horário</th>
                              <th>Profissional</th>
                              <th>Atendimento</th>
                              <th>Situação</th>
                            </tr>
                          </thead>

                          <tbody>
                            {availableSlots.map((slot, index) => {
                              const slotData =
                                typeof slot === 'object' &&
                                slot !== null
                                  ? slot
                                  : { hora: String(slot) };

                              const slotTime =
                                slotData.hora ||
                                slotData.horario ||
                                slotData.inicio ||
                                '—';

                              return (
                                <tr
                                  key={slotData.id ?? index}
                                >
                                  <td>
                                    <strong>
                                      {String(slotTime)
                                        .slice(0, 5)}
                                    </strong>
                                  </td>

                                  <td>
                                    {slotData.profissional ||
                                      'Não informado'}
                                  </td>

                                  <td>
                                    {slotData.tipo ||
                                      'Não informado'}
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        'booking-status status-active'
                                      }
                                    >
                                      Disponível
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                      </div>
                    )}

                  </div>

                </section>
              )}


              {/* GERENCIAMENTO DE FUNCIONÁRIOS */}
              {isClinic && screen === 'employees' && (
                <section className="employees-page">

                  <div className="heading">
                    <div>
                      <h1>Gerenciar funcionários</h1>
                      <p>
                        Cadastre e administre os profissionais
                        que possuem acesso ao sistema VetRP.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={loadEmployees}
                    >
                      Atualizar lista
                    </button>
                  </div>

                  {/* RESUMO DOS FUNCIONÁRIOS */}
                  <div className="stats">

                    <div>
                      <small>Total de funcionários</small>
                      <strong>{employees.length}</strong>
                    </div>

                    <div>
                      <small>Funcionários ativos</small>
                      <strong>
                        {employees.filter(
                          employee => employee.ativo === true
                        ).length}
                      </strong>
                    </div>

                    <div>
                      <small>Funcionários inativos</small>
                      <strong>
                        {employees.filter(
                          employee => employee.ativo === false
                        ).length}
                      </strong>
                    </div>

                  </div>

                  {/* CADASTRO DE FUNCIONÁRIO */}
                  <div className="panel employee-form-panel">

                    <div className="pet-form-intro">
                      <div className="pet-form-icon">
                        <Users size={30} />
                      </div>

                      <div>
                        <h2>Cadastrar funcionário</h2>
                        <p>
                          Preencha os dados do profissional
                          para criar seu acesso.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={saveEmployee}>

                      <div className="form-grid">

                        {/* NOME */}
                        <label>
                          Nome completo

                          <input
                            type="text"
                            value={employeeForm.nome || ''}
                            onChange={e =>
                              setEmployeeForm(previous => ({
                                ...previous,
                                nome: e.target.value
                              }))
                            }
                            placeholder="Nome do funcionário"
                            required
                          />
                        </label>

                        {/* E-MAIL */}
                        <label>
                          E-mail profissional

                          <input
                            type="email"
                            value={employeeForm.email || ''}
                            onChange={e =>
                              setEmployeeForm(previous => ({
                                ...previous,
                                email: e.target.value
                              }))
                            }
                            placeholder="funcionario@clinica.com"
                            required
                          />
                        </label>

                        {/* TELEFONE */}
                        <label>
                          Telefone

                          <input
                            type="tel"
                            value={employeeForm.telefone || ''}
                            onChange={e =>
                              setEmployeeForm(previous => ({
                                ...previous,
                                telefone: e.target.value
                              }))
                            }
                            placeholder="(11) 99999-9999"
                          />
                        </label>

                        {/* CARGO */}
                        <label>
                          Cargo

                          <select
                            value={employeeForm.cargo || ''}
                            onChange={e =>
                              setEmployeeForm(previous => ({
                                ...previous,
                                cargo: e.target.value
                              }))
                            }
                            required
                          >
                            <option value="">
                              Selecione um cargo
                            </option>

                            <option value="Veterinário">
                              Veterinário(a)
                            </option>

                            <option value="Recepcionista">
                              Recepcionista
                            </option>

                            <option value="Administrador">
                              Administrador(a)
                            </option>

                            <option value="Auxiliar">
                              Auxiliar veterinário
                            </option>
                          </select>
                        </label>

                        {/* SENHA */}
                        <label className="full">
                          Senha inicial

                          <input
                            type="password"
                            value={employeeForm.senha || ''}
                            onChange={e =>
                              setEmployeeForm(previous => ({
                                ...previous,
                                senha: e.target.value
                              }))
                            }
                            placeholder="Crie uma senha segura"
                            minLength={10}
                            required
                          />

                          <small>
                            Utilize pelo menos 10 caracteres,
                            com letra maiúscula, minúscula,
                            número e símbolo.
                          </small>
                        </label>

                      </div>

                      <div className="actions">
                        <button
                          type="submit"
                          className="primary compact"
                        >
                          <Plus size={19} />
                          Cadastrar funcionário
                        </button>
                      </div>

                    </form>

                  </div>

                  {/* LISTA DE FUNCIONÁRIOS */}
                  <div className="panel employees-list-panel">

                    <div className="bookings-panel-header">
                      <div>
                        <h2>Funcionários cadastrados</h2>
                        <p>
                          Consulte os profissionais
                          e gerencie seus acessos.
                        </p>
                      </div>
                    </div>

                    {employees.length === 0 ? (
                      <div className="agenda-empty">
                        <Users size={48} />

                        <h3>Nenhum funcionário encontrado</h3>

                        <p>
                          Os funcionários cadastrados
                          aparecerão nesta lista.
                        </p>
                      </div>
                    ) : (
                      <div className="table-scroll">

                        <table className="bookings-table">

                          <thead>
                            <tr>
                              <th>Funcionário</th>
                              <th>E-mail</th>
                              <th>Telefone</th>
                              <th>Cargo</th>
                              <th>Status</th>
                              <th>Ações</th>
                            </tr>
                          </thead>

                          <tbody>
                            {employees.map(employee => {
                              const isActive =
                                employee.ativo === true;

                              return (
                                <tr key={employee.id}>

                                  <td>
                                    <strong>
                                      {employee.nome || '—'}
                                    </strong>
                                  </td>

                                  <td>
                                    {employee.email || '—'}
                                  </td>

                                  <td>
                                    {employee.telefone || '—'}
                                  </td>

                                  <td>
                                    {employee.cargo || '—'}
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        'booking-status ' +
                                        (isActive
                                          ? 'status-active'
                                          : 'status-cancelled')
                                      }
                                    >
                                      {isActive
                                        ? 'Ativo'
                                        : 'Inativo'}
                                    </span>
                                  </td>

                                  <td>
                                    <button
                                      type="button"
                                      className="secondary compact"
                                      onClick={() => {
                                        const action =
                                          isActive
                                            ? 'desativar'
                                            : 'ativar';

                                        const confirmed =
                                          window.confirm(
                                            `Deseja ${action} o acesso de ${employee.nome}?`
                                          );

                                        if (confirmed) {
                                          toggleEmployee(employee);
                                        }
                                      }}
                                    >
                                      {isActive
                                        ? 'Desativar'
                                        : 'Ativar'}
                                    </button>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>

                        </table>

                      </div>
                    )}

                  </div>

                </section>
              )}


              {/* RELATÓRIOS DA CLÍNICA */}
              {isClinic && screen === 'reports' && (
                <section className="clinic-reports-page">

                  <div className="heading">
                    <div>
                      <h1>Relatórios da clínica</h1>
                      <p>
                        Acompanhe os atendimentos e
                        indicadores de funcionamento
                        da VetRP.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={loadReport}
                    >
                      Atualizar relatório
                    </button>
                  </div>

                  {/* FILTRO POR PERÍODO */}
                  <div className="panel reports-filter-panel">

                    <div className="bookings-panel-header">
                      <div>
                        <h2>Período do relatório</h2>
                        <p>
                          Selecione as datas para
                          consultar os indicadores.
                        </p>
                      </div>
                    </div>

                    <div className="form-grid">

                      <label>
                        Data inicial

                        <input
                          type="date"
                          value={period.inicio || ''}
                          onChange={e =>
                            setPeriod(previous => ({
                              ...(typeof previous === 'object' &&
                              previous !== null
                                ? previous
                                : {}),
                              inicio: e.target.value
                            }))
                          }
                        />
                      </label>

                      <label>
                        Data final

                        <input
                          type="date"
                          min={period.inicio || undefined}
                          value={period.fim || ''}
                          onChange={e =>
                            setPeriod(previous => ({
                              ...(typeof previous === 'object' &&
                              previous !== null
                                ? previous
                                : {}),
                              fim: e.target.value
                            }))
                          }
                        />
                      </label>

                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        className="primary compact"
                        onClick={() => {
                          if (
                            period.inicio &&
                            period.fim &&
                            period.inicio > period.fim
                          ) {
                            setNotice(
                              'A data inicial não pode ser posterior à data final.'
                            );
                            return;
                          }

                          loadReport();
                        }}
                      >
                        <ChartPie size={19} />
                        Gerar relatório
                      </button>
                    </div>

                  </div>

                  {/* INDICADORES */}
                  {(() => {
                    const data =
                      report &&
                      typeof report === 'object'
                        ? report
                        : {};

                    const consultas = Number(
                      data.consultas ??
                      data.totalConsultas ??
                      0
                    );

                    const exames = Number(
                      data.exames ??
                      data.totalExames ??
                      0
                    );

                    const cirurgias = Number(
                      data.cirurgias ??
                      data.totalCirurgias ??
                      0
                    );

                    const cancelamentos = Number(
                      data.cancelamentos ??
                      data.totalCancelamentos ??
                      0
                    );

                    const total =
                      consultas + exames + cirurgias;

                    const indicators = [
                      {
                        title: 'Consultas',
                        value: consultas,
                        icon: CalendarDays
                      },
                      {
                        title: 'Exames',
                        value: exames,
                        icon: FlaskConical
                      },
                      {
                        title: 'Cirurgias',
                        value: cirurgias,
                        icon: PawPrint
                      },
                      {
                        title: 'Cancelamentos',
                        value: cancelamentos,
                        icon: ChartPie
                      }
                    ];

                    const maxValue = Math.max(
                      consultas,
                      exames,
                      cirurgias,
                      1
                    );

                    return (
                      <>
                        <div className="stats reports-stats">

                          {indicators.map(indicator => {
                            const Icon = indicator.icon;

                            return (
                              <div key={indicator.title}>
                                <div className="report-stat-icon">
                                  <Icon size={23} />
                                </div>

                                <small>
                                  {indicator.title}
                                </small>

                                <strong>
                                  {indicator.value}
                                </strong>
                              </div>
                            );
                          })}

                        </div>

                        {/* RESUMO */}
                        <div className="panel reports-summary-panel">

                          <div className="bookings-panel-header">
                            <div>
                              <h2>Resumo dos atendimentos</h2>
                              <p>
                                Quantidade de procedimentos
                                registrada no período.
                              </p>
                            </div>
                          </div>

                          <div className="reports-total">
                            <small>
                              Total de atendimentos
                            </small>

                            <strong>{total}</strong>
                          </div>

                          <div className="reports-chart">

                            {[
                              {
                                name: 'Consultas',
                                value: consultas
                              },
                              {
                                name: 'Exames',
                                value: exames
                              },
                              {
                                name: 'Cirurgias',
                                value: cirurgias
                              }
                            ].map(item => (
                              <div
                                className="report-chart-row"
                                key={item.name}
                              >
                                <div className="report-chart-label">
                                  <span>{item.name}</span>
                                  <strong>{item.value}</strong>
                                </div>

                                <div className="report-chart-track">
                                  <div
                                    className="report-chart-fill"
                                    style={{
                                      width: `${
                                        (item.value / maxValue) * 100
                                      }%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}

                          </div>

                          {total === 0 && (
                            <p className="report-empty-message">
                              Nenhum atendimento foi
                              registrado para este período.
                            </p>
                          )}

                        </div>

                        {/* TABELA RESUMIDA */}
                        <div className="panel reports-table-panel">

                          <div className="bookings-panel-header">
                            <div>
                              <h2>Detalhamento do relatório</h2>
                              <p>
                                Resumo dos indicadores
                                registrados pela clínica.
                              </p>
                            </div>
                          </div>

                          <div className="table-scroll">
                            <table className="bookings-table">

                              <thead>
                                <tr>
                                  <th>Indicador</th>
                                  <th>Quantidade</th>
                                </tr>
                              </thead>

                              <tbody>
                                <tr>
                                  <td>Consultas realizadas</td>
                                  <td>{consultas}</td>
                                </tr>

                                <tr>
                                  <td>Exames registrados</td>
                                  <td>{exames}</td>
                                </tr>

                                <tr>
                                  <td>Cirurgias registradas</td>
                                  <td>{cirurgias}</td>
                                </tr>

                                <tr>
                                  <td>Cancelamentos</td>
                                  <td>{cancelamentos}</td>
                                </tr>

                                <tr>
                                  <td>
                                    <strong>
                                      Total de atendimentos
                                    </strong>
                                  </td>

                                  <td>
                                    <strong>{total}</strong>
                                  </td>
                                </tr>
                              </tbody>

                            </table>
                          </div>

                        </div>
                      </>
                    );
                  })()}

                </section>
              )}


              {/* PACIENTES DA CLÍNICA */}
              {isClinic && screen === 'patients' && (
                <section className="clinic-patients-page">

                  <div className="heading">
                    <div>
                      <h1>Pacientes da clínica</h1>
                      <p>
                        Consulte os animais cadastrados
                        e suas informações.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={refresh}
                    >
                      Atualizar pacientes
                    </button>
                  </div>

                  {/* INDICADORES */}
                  <div className="stats">

                    <div>
                      <small>Total de pacientes</small>
                      <strong>{pets.length}</strong>
                    </div>

                    <div>
                      <small>Cães cadastrados</small>
                      <strong>
                        {pets.filter(animal =>
                          ['canina', 'cachorro', 'cão']
                            .includes(
                              String(animal.especie || '')
                                .toLowerCase()
                            )
                        ).length}
                      </strong>
                    </div>

                    <div>
                      <small>Gatos cadastrados</small>
                      <strong>
                        {pets.filter(animal =>
                          ['felina', 'gato']
                            .includes(
                              String(animal.especie || '')
                                .toLowerCase()
                            )
                        ).length}
                      </strong>
                    </div>

                  </div>

                  {/* PESQUISA */}
                  <div className="panel patients-search-panel">

                    <h2>Pesquisar pacientes</h2>

                    <p>
                      Busque pelo nome do animal,
                      espécie, raça ou tutor.
                    </p>

                    <label>
                      Pesquisar

                      <input
                        type="search"
                        value={search}
                        onChange={e =>
                          setSearch(e.target.value)
                        }
                        placeholder="Digite o nome do animal ou tutor..."
                      />
                    </label>

                    {search && (
                      <button
                        type="button"
                        className="secondary compact"
                        onClick={() => setSearch('')}
                      >
                        Limpar pesquisa
                      </button>
                    )}

                  </div>

                  {/* LISTA DE PACIENTES */}
                  {(() => {
                    const filteredPets = pets.filter(animal => {
                      const tutorName =
                        animal.tutorNome ||
                        animal.nomeTutor ||
                        animal.tutor?.nome ||
                        '';

                      const searchableText = [
                        animal.nome,
                        animal.especie,
                        animal.raca,
                        tutorName
                      ]
                        .join(' ')
                        .toLowerCase();

                      return searchableText.includes(
                        search.trim().toLowerCase()
                      );
                    });

                    const selectedPatient =
                      filteredPets.find(
                        animal =>
                          String(animal.id) ===
                          String(selected)
                      ) || filteredPets[0];

                    if (filteredPets.length === 0) {
                      return (
                        <div className="panel agenda-empty">

                          <PawPrint size={48} />

                          <h2>Nenhum paciente encontrado</h2>

                          <p>
                            Não há animais correspondentes
                            à pesquisa realizada.
                          </p>

                        </div>
                      );
                    }

                    return (
                      <div className="two-col">

                        {/* LISTA */}
                        <div className="panel patients-list-panel">

                          <div className="bookings-panel-header">
                            <div>
                              <h2>Pacientes cadastrados</h2>

                              <p>
                                {filteredPets.length}
                                {' '}
                                paciente(s) encontrado(s).
                              </p>
                            </div>
                          </div>

                          <div className="stack">

                            {filteredPets.map(animal => (
                              <button
                                key={animal.id}
                                type="button"
                                className={
                                  'pet-item ' +
                                  (String(selectedPatient?.id) ===
                                  String(animal.id)
                                    ? 'active'
                                    : '')
                                }
                                onClick={() =>
                                  setSelected(animal.id)
                                }
                              >
                                <span className="pet-item-icon">
                                  <PawPrint size={23} />
                                </span>

                                <span>
                                  <strong>
                                    {animal.nome}
                                  </strong>

                                  <small>
                                    {animal.especie || 'Animal'}

                                    {animal.raca
                                      ? ` • ${animal.raca}`
                                      : ''}
                                  </small>
                                </span>
                              </button>
                            ))}

                          </div>

                        </div>

                        {/* DETALHES DO PACIENTE */}
                        {selectedPatient && (
                          <div className="panel patient-details-panel">

                            <div className="pet-details-header">

                              <div className="pet-details-avatar">
                                <PawPrint size={38} />
                              </div>

                              <div>
                                <span className="public-eyebrow">
                                  FICHA DO PACIENTE
                                </span>

                                <h2>
                                  {selectedPatient.nome}
                                </h2>

                                <p>
                                  {selectedPatient.especie ||
                                    'Animal'}

                                  {selectedPatient.raca
                                    ? ` • ${selectedPatient.raca}`
                                    : ''}
                                </p>
                              </div>

                            </div>

                            <div className="personal-divider" />

                            <h3>Informações do animal</h3>

                            <div className="info-grid">

                              <div>
                                <small>Nome</small>
                                <strong>
                                  {selectedPatient.nome || '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Espécie</small>
                                <strong>
                                  {selectedPatient.especie || '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Raça</small>
                                <strong>
                                  {selectedPatient.raca || '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Sexo</small>
                                <strong>
                                  {selectedPatient.sexo || '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Data de nascimento</small>
                                <strong>
                                  {selectedPatient.nascimento
                                    ? formatDate(
                                        selectedPatient.nascimento
                                      )
                                    : '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Peso</small>
                                <strong>
                                  {selectedPatient.peso != null &&
                                  selectedPatient.peso !== ''
                                    ? `${selectedPatient.peso} kg`
                                    : '—'}
                                </strong>
                              </div>

                              <div>
                                <small>Pelagem</small>
                                <strong>
                                  {selectedPatient.pelagem || '—'}
                                </strong>
                              </div>

                            </div>

                            {/* TUTOR */}
                            <div className="personal-divider" />

                            <h3>Informações do tutor</h3>

                            <div className="info-grid">

                              <div>
                                <small>Nome do tutor</small>
                                <strong>
                                  {selectedPatient.tutorNome ||
                                    selectedPatient.nomeTutor ||
                                    selectedPatient.tutor?.nome ||
                                    'Não informado'}
                                </strong>
                              </div>

                              <div>
                                <small>Telefone</small>
                                <strong>
                                  {selectedPatient.tutorTelefone ||
                                    selectedPatient.tutor?.telefone ||
                                    'Não informado'}
                                </strong>
                              </div>

                              <div>
                                <small>E-mail</small>
                                <strong>
                                  {selectedPatient.tutorEmail ||
                                    selectedPatient.tutor?.email ||
                                    'Não informado'}
                                </strong>
                              </div>

                            </div>

                            {/* OBSERVAÇÕES */}
                            <div className="note">

                              <h3>Observações</h3>

                              <p>
                                {selectedPatient.observacoes ||
                                  'Nenhuma observação cadastrada.'}
                              </p>

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })()}

                </section>
              )}


              {/* PRONTUÁRIO BÁSICO DOS PACIENTES */}
              {isClinic && screen === 'records' && (
                <section className="clinic-records-page">

                  <div className="heading">
                    <div>
                      <h1>Prontuário dos pacientes</h1>
                      <p>
                        Consulte as informações clínicas
                        e o histórico básico de atendimentos.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={refresh}
                    >
                      Atualizar dados
                    </button>
                  </div>

                  {/* SELEÇÃO DO PACIENTE */}
                  <div className="panel records-search-panel">

                    <h2>Selecionar paciente</h2>

                    <p>
                      Escolha um animal cadastrado para
                      visualizar seu prontuário.
                    </p>

                    <label>
                      Paciente

                      <select
                        value={
                          pets.some(
                            animal =>
                              String(animal.id) ===
                              String(selected)
                          )
                            ? String(selected)
                            : ''
                        }
                        onChange={e =>
                          setSelected(e.target.value)
                        }
                      >
                        <option value="">
                          Selecione um paciente
                        </option>

                        {pets.map(animal => (
                          <option
                            key={animal.id}
                            value={animal.id}
                          >
                            {animal.nome}
                            {' — '}
                            {animal.especie || 'Animal'}
                          </option>
                        ))}
                      </select>
                    </label>

                  </div>

                  {/* DADOS DO PRONTUÁRIO */}
                  {(() => {
                    const patient = pets.find(
                      animal =>
                        String(animal.id) ===
                        String(selected)
                    );

                    if (!patient) {
                      return (
                        <div className="panel agenda-empty">

                          <PawPrint size={50} />

                          <h2>Nenhum paciente selecionado</h2>

                          <p>
                            Selecione um animal acima
                            para consultar seu prontuário.
                          </p>

                        </div>
                      );
                    }

                    const patientAppointments =
                      appointments.filter(item => {
                        const appointmentAnimalId =
                          item.animalId ??
                          item.animal?.id ??
                          item.pacienteId;

                        return (
                          String(appointmentAnimalId) ===
                          String(patient.id)
                        );
                      });

                    return (
                      <>

                        {/* IDENTIFICAÇÃO DO PACIENTE */}
                        <div className="panel records-patient-panel">

                          <div className="pet-details-header">

                            <div className="pet-details-avatar">
                              <PawPrint size={38} />
                            </div>

                            <div>
                              <span className="public-eyebrow">
                                PRONTUÁRIO VETERINÁRIO
                              </span>

                              <h2>{patient.nome}</h2>

                              <p>
                                {patient.especie || 'Animal'}

                                {patient.raca
                                  ? ` • ${patient.raca}`
                                  : ''}
                              </p>
                            </div>

                          </div>

                          <div className="personal-divider" />

                          <h3>Identificação do paciente</h3>

                          <div className="info-grid">

                            <div>
                              <small>Nome</small>
                              <strong>
                                {patient.nome || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Espécie</small>
                              <strong>
                                {patient.especie || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Raça</small>
                              <strong>
                                {patient.raca || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Sexo</small>
                              <strong>
                                {patient.sexo || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Nascimento</small>
                              <strong>
                                {patient.nascimento
                                  ? formatDate(
                                      patient.nascimento
                                    )
                                  : '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Peso</small>
                              <strong>
                                {patient.peso != null &&
                                patient.peso !== ''
                                  ? `${patient.peso} kg`
                                  : '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Pelagem</small>
                              <strong>
                                {patient.pelagem || '—'}
                              </strong>
                            </div>

                            <div>
                              <small>Tutor responsável</small>
                              <strong>
                                {patient.tutorNome ||
                                  patient.nomeTutor ||
                                  patient.tutor?.nome ||
                                  'Não informado'}
                              </strong>
                            </div>

                          </div>

                        </div>

                        {/* OBSERVAÇÕES CLÍNICAS */}
                        <div className="panel records-clinical-panel">

                          <div className="bookings-panel-header">
                            <div>
                              <h2>Informações clínicas</h2>

                              <p>
                                Observações registradas
                                no cadastro do paciente.
                              </p>
                            </div>
                          </div>

                          <div className="note">

                            <h3>Observações gerais</h3>

                            <p>
                              {patient.observacoes ||
                                'Nenhuma observação cadastrada.'}
                            </p>

                          </div>

                          <p>
                            As informações exibidas nesta
                            seção são provenientes do
                            cadastro do animal.
                          </p>

                        </div>

                        {/* HISTÓRICO DE ATENDIMENTOS */}
                        <div className="panel records-history-panel">

                          <div className="bookings-panel-header">
                            <div>
                              <h2>Histórico de atendimentos</h2>

                              <p>
                                Consultas, exames e outros
                                atendimentos vinculados
                                a este paciente.
                              </p>
                            </div>
                          </div>

                          {patientAppointments.length === 0 ? (
                            <div className="agenda-empty">

                              <CalendarDays size={45} />

                              <h3>
                                Nenhum atendimento encontrado
                              </h3>

                              <p>
                                Não há atendimentos
                                disponíveis para este paciente.
                              </p>

                            </div>
                          ) : (
                            <div className="table-scroll">

                              <table className="bookings-table">

                                <thead>
                                  <tr>
                                    <th>Data</th>
                                    <th>Atendimento</th>
                                    <th>Profissional</th>
                                    <th>Motivo</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {[...patientAppointments]
                                    .sort((a, b) => {
                                      const dateA = String(
                                        a.data ||
                                        a.dataAgendamento ||
                                        a.horario?.data ||
                                        ''
                                      );

                                      const dateB = String(
                                        b.data ||
                                        b.dataAgendamento ||
                                        b.horario?.data ||
                                        ''
                                      );

                                      return dateB.localeCompare(
                                        dateA
                                      );
                                    })
                                    .map(item => {
                                      const status = String(
                                        item.status || 'AGENDADO'
                                      ).toUpperCase();

                                      const cancelled = [
                                        'CANCELADO',
                                        'CANCELADA'
                                      ].includes(status);

                                      const finished = [
                                        'CONCLUIDO',
                                        'CONCLUÍDO',
                                        'REALIZADO',
                                        'FINALIZADO'
                                      ].includes(status);

                                      const appointmentDate =
                                        item.data ||
                                        item.dataAgendamento ||
                                        item.horario?.data ||
                                        '';

                                      return (
                                        <tr key={item.id}>

                                          <td>
                                            {appointmentDate
                                              ? formatDate(
                                                  String(
                                                    appointmentDate
                                                  ).slice(0, 10)
                                                )
                                              : '—'}
                                          </td>

                                          <td>
                                            {item.tipo ||
                                              'Consulta'}
                                          </td>

                                          <td>
                                            {item.profissional ||
                                              'Não informado'}
                                          </td>

                                          <td>
                                            {item.motivo ||
                                              'Não informado'}
                                          </td>

                                          <td>
                                            <span
                                              className={
                                                'booking-status ' +
                                                (cancelled
                                                  ? 'status-cancelled'
                                                  : finished
                                                    ? 'status-finished'
                                                    : 'status-active')
                                              }
                                            >
                                              {status}
                                            </span>
                                          </td>

                                        </tr>
                                      );
                                    })}
                                </tbody>

                              </table>

                            </div>
                          )}

                        </div>

                      </>
                    );
                  })()}

                </section>
              )}

              <footer className="workspace-footer">
                <small>© {new Date().getFullYear()} VetRP Web • MVP acadêmico</small>
                <a href="/privacidade.html" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
              </footer>

            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
