
package br.com.vetrp.vetrp_web.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.com.vetrp.vetrp_web.model.Agendamento;
import br.com.vetrp.vetrp_web.model.Animal;
import br.com.vetrp.vetrp_web.model.Horario;
import br.com.vetrp.vetrp_web.model.Usuario;
import br.com.vetrp.vetrp_web.model.Perfil;
import br.com.vetrp.vetrp_web.repository.AgendamentoRepository;
import br.com.vetrp.vetrp_web.repository.AnimalRepository;
import br.com.vetrp.vetrp_web.repository.HorarioRepository;
import br.com.vetrp.vetrp_web.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final UsuarioRepository users;
    private final AnimalRepository animals;
    private final HorarioRepository slots;
    private final AgendamentoRepository bookings;
    private final PasswordEncoder encoder;

    public ApiController(
            UsuarioRepository u,
            AnimalRepository a,
            HorarioRepository h,
            AgendamentoRepository b,
            PasswordEncoder e
    ) {
        users = u;
        animals = a;
        slots = h;
        bookings = b;
        encoder = e;
    }

    // Senhas fortes validadas também no servidor (não apenas no React).
    private static void requireStrongPassword(String password) {
        if (password == null || password.length() < 10 ||
                !password.matches(".*[A-Z].*") ||
                !password.matches(".*[a-z].*") ||
                !password.matches(".*[0-9].*") ||
                !password.matches(".*[^A-Za-z0-9].*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A senha precisa de 10 caracteres, maiuscula, minuscula, numero e simbolo");
        }
    }

    // DADOS DOS FORMULÁRIOS

    public record Register(
            @NotBlank String nome,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 10) String senha,
            String telefone,
            String cep,
            String rua,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf
    ) {}

    public record EmployeeInput(
            @NotBlank String nome,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 10) String senha,
            @NotNull Perfil perfil,
            String telefone,
            String crmv,
            String crmvUf,
            String especialidade
    ) {}

    public record PetInput(
            @NotBlank String nome,
            @NotBlank String especie,
            String raca,
            String sexo,
            LocalDate nascimento,
            Double peso,
            String pelagem,
            String observacoes
    ) {}

    public record SlotInput(
            @NotNull LocalDate data,
            @NotNull LocalTime hora,
            boolean liberado
    ) {}

    public record BookingInput(
            @NotNull Long animalId,
            @NotNull Long horarioId,
            @NotBlank String tipo,
            String motivo,
            String profissional
    ) {}

    // AUTENTICAÇÃO

    private Usuario me(Authentication a) {
        if (a == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED
            );
        }

        return users.findByEmailIgnoreCase(a.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED
                        )
                );
    }

    private boolean staff(Usuario u) {
        return u.perfil != Perfil.TUTOR;
    }

    private void requireAdmin(Authentication a) {
        if (me(a).perfil != Perfil.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private Animal pet(Long id, Usuario u) {
        var p = animals.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND
                        )
                );

        if (!staff(u) &&
                (p.tutor == null ||
                 !Objects.equals(p.tutor.id, u.id))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN
            );
        }

        return p;
    }

    // CADASTRO PÚBLICO DE TUTOR

    @PostMapping("/auth/register")
    @Transactional
    public Map<String, Object> register(
            @Valid @RequestBody Register r
    ) {
        String email = r.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "E-mail ja cadastrado"
            );
        }

        var u = new Usuario();

        u.nome = r.nome().trim();
        u.email = email;
        requireStrongPassword(r.senha());
        u.senhaHash = encoder.encode(r.senha());
        u.perfil = Perfil.TUTOR;
        u.ativo = true;

        u.telefone = r.telefone();
        u.cep = r.cep();
        u.rua = r.rua();
        u.numero = r.numero();
        u.complemento = r.complemento();
        u.bairro = r.bairro();
        u.cidade = r.cidade();
        u.uf = r.uf();

        users.save(u);

        return Map.of(
                "id", u.id,
                "message", "Cadastro realizado"
        );
    }

    // DADOS DO USUÁRIO LOGADO

    @GetMapping("/auth/me")
    public Map<String, Object> who(Authentication a) {
        var u = me(a);

        return Map.of(
                "id", u.id,
                "nome", u.nome,
                "perfil", u.perfil.name()
        );
    }


    // DADOS PESSOAIS DO USUARIO

    public record PersonalInput(
            @NotBlank String nome,
            @Email @NotBlank String email,
            String telefone,
            String cep,
            String rua,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf
    ) {}

    private Map<String, Object> personalView(Usuario u) {
        Map<String, Object> dados = new LinkedHashMap<>();

        dados.put("id", u.id);
        dados.put("nome", u.nome);
        dados.put("email", u.email);
        dados.put("perfil", u.perfil.name());
        dados.put("telefone", u.telefone);
        dados.put("cep", u.cep);
        dados.put("rua", u.rua);
        dados.put("numero", u.numero);
        dados.put("complemento", u.complemento);
        dados.put("bairro", u.bairro);
        dados.put("cidade", u.cidade);
        dados.put("uf", u.uf);

        return dados;
    }

    @GetMapping("/auth/dados")
    public Map<String, Object> personalData(
            Authentication a
    ) {
        return personalView(me(a));
    }

    @PutMapping("/auth/dados")
    @Transactional
    public Map<String, Object> updatePersonalData(
            Authentication a,
            @Valid @RequestBody PersonalInput input
    ) {
        Usuario usuario = me(a);

        String email = input.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        var existente = users.findByEmailIgnoreCase(email);

        if (existente.isPresent()
                && !Objects.equals(
                        existente.get().id,
                        usuario.id
                )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "E-mail ja cadastrado"
            );
        }

        usuario.nome = input.nome().trim();
        usuario.email = email;
        usuario.telefone = input.telefone();
        usuario.cep = input.cep();
        usuario.rua = input.rua();
        usuario.numero = input.numero();
        usuario.complemento = input.complemento();
        usuario.bairro = input.bairro();
        usuario.cidade = input.cidade();
        usuario.uf = input.uf();

        users.save(usuario);

        return personalView(usuario);
    }


    // ADMINISTRADOR CADASTRA FUNCIONÁRIOS

    @PostMapping("/clinica/funcionarios")
    @Transactional
    public Map<String, Object> createEmployee(
            Authentication a,
            @Valid @RequestBody EmployeeInput r
    ) {
        requireAdmin(a);

        if (r.perfil() != Perfil.RECEPCAO &&
                r.perfil() != Perfil.VETERINARIO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selecione RECEPCAO ou VETERINARIO"
            );
        }

        String email = r.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "E-mail ja cadastrado"
            );
        }

        if (r.perfil() == Perfil.VETERINARIO &&
                (r.crmv() == null ||
                 r.crmv().isBlank() ||
                 r.crmvUf() == null ||
                 r.crmvUf().isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CRMV e UF sao obrigatorios"
            );
        }

        var u = new Usuario();

        u.nome = r.nome().trim();
        u.email = email;
        requireStrongPassword(r.senha());
        u.senhaHash = encoder.encode(r.senha());
        u.perfil = r.perfil();
        u.telefone = r.telefone();
        u.crmv = r.crmv();
        u.crmvUf = r.crmvUf();
        u.especialidade = r.especialidade();
        u.ativo = true;

        users.save(u);

        return Map.of(
                "id", u.id,
                "message", "Funcionario cadastrado"
        );
    }

    // ADMINISTRADOR LISTA FUNCIONÁRIOS

    @GetMapping("/clinica/funcionarios")
    public List<Map<String, Object>> listEmployees(
            Authentication a
    ) {
        requireAdmin(a);

        return users.findAll()
                .stream()
                .filter(u -> u.perfil != Perfil.TUTOR)
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.id);
                    m.put("nome", u.nome);
                    m.put("email", u.email);
                    m.put("perfil", u.perfil.name());
                    m.put("telefone", u.telefone);
                    m.put("crmv", u.crmv);
                    m.put("crmvUf", u.crmvUf);
                    m.put("especialidade", u.especialidade);
                    m.put("ativo", u.ativo);
                    return m;
                })
                .toList();
    }

    // ADMINISTRADOR ATIVA OU DESATIVA FUNCIONÁRIO

    @PatchMapping("/clinica/funcionarios/{id}/ativo")
    @Transactional
    public Map<String, Object> setEmployeeActive(
            Authentication a,
            @PathVariable Long id,
            @RequestParam boolean ativo
    ) {
        requireAdmin(a);

        var u = users.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND
                        )
                );

        if (u.perfil == Perfil.TUTOR) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST
            );
        }

        if (Objects.equals(u.id, me(a).id) && !ativo) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nao e permitido desativar a propria conta"
            );
        }

        u.ativo = ativo;
        users.save(u);

        return Map.of(
                "id", u.id,
                "ativo", u.ativo
        );
    }

    // LISTAR ANIMAIS

    @GetMapping("/animais")
    public List<Map<String, Object>> listPets(
            Authentication a
    ) {
        var u = me(a);

        return (staff(u)
                ? animals.findAll()
                : animals.findByTutorIdAndAtivoTrue(u.id))
                .stream()
                .map(this::petView)
                .toList();
    }

    private Map<String, Object> petView(Animal p) {
        Map<String, Object> m = new LinkedHashMap<>();

        m.put("id", p.id);
        m.put("nome", p.nome);
        m.put("especie", p.especie);
        m.put("raca", p.raca);
        m.put("sexo", p.sexo);
        m.put("nascimento", p.nascimento);
        m.put("peso", p.peso);
        m.put("pelagem", p.pelagem);
        m.put("observacoes", p.observacoes);

        if (p.tutor != null) {
            m.put("tutor", p.tutor.nome);
        }

        return m;
    }

    // CADASTRAR ANIMAL

    @PostMapping("/animais")
    @Transactional
    public Map<String, Object> createPet(
            Authentication a,
            @Valid @RequestBody PetInput r
    ) {
        var p = new Animal();

        p.tutor = me(a);
        fillPet(p, r);

        animals.save(p);

        return petView(p);
    }

    // EDITAR ANIMAL

    @PutMapping("/animais/{id}")
    @Transactional
    public Map<String, Object> updatePet(
            Authentication a,
            @PathVariable Long id,
            @Valid @RequestBody PetInput r
    ) {
        var p = pet(id, me(a));

        fillPet(p, r);
        animals.save(p);

        return petView(p);
    }

    private void fillPet(Animal p, PetInput r) {
        p.nome = r.nome();
        p.especie = r.especie();
        p.raca = r.raca();
        p.sexo = r.sexo();
        p.nascimento = r.nascimento();
        p.peso = r.peso();
        p.pelagem = r.pelagem();
        p.observacoes = r.observacoes();
    }

    // CONSULTAR HORÁRIOS

    @GetMapping("/horarios")
    public List<Map<String, Object>> listSlots(
            @RequestParam LocalDate data
    ) {
        return slots.findAll()
                .stream()
                .filter(s ->
                        s.data.equals(data) && s.liberado
                )
                .sorted(Comparator.comparing(s -> s.hora))
                .map(s -> Map.<String, Object>of(
                        "id", s.id,
                        "data", s.data,
                        "hora", s.hora.toString(),
                        "disponivel",
                        bookings.findByHorarioIdAndStatus(
                                s.id, "AGENDADO"
                        ).isEmpty()
                ))
                .toList();
    }

    // CLÍNICA LIBERA OU BLOQUEIA HORÁRIOS

    @PostMapping("/clinica/horarios")
    @Transactional
    public Map<String, Object> addSlot(
            @Valid @RequestBody SlotInput r
    ) {
        var s = slots.findByDataAndHora(
                r.data(), r.hora()
        ).orElseGet(Horario::new);

        s.data = r.data();
        s.hora = r.hora();
        s.liberado = r.liberado();

        slots.save(s);

        return Map.of(
                "id", s.id,
                "liberado", s.liberado
        );
    }

    // LISTAR AGENDAMENTOS

    @GetMapping("/agendamentos")
    public List<Map<String, Object>> listBookings(
            Authentication a
    ) {
        var u = me(a);

        return (staff(u)
                ? bookings.findAll()
                : bookings.findByAnimalTutorId(u.id))
                .stream()
                .map(this::bookingView)
                .toList();
    }

    private Map<String, Object> bookingView(
            Agendamento a
    ) {
        return Map.of(
                "id", a.id,
                "pet", a.animal.nome,
                "animalId", a.animal.id,
                "tipo", "EXAME".equalsIgnoreCase(a.tipo) ? "Exame" : "Consulta",
                "data", a.horario.data.toString(),
                "hora", a.horario.hora.toString(),
                "status", a.status,
                "profissional",
                a.profissional == null
                        ? "A definir"
                        : a.profissional
        );
    }

    // REALIZAR AGENDAMENTO

    @PostMapping("/agendamentos")
    @Transactional
    public Map<String, Object> book(
            Authentication a,
            @Valid @RequestBody BookingInput r
    ) {
        var u = me(a);
        var p = pet(r.animalId(), u);

        var s = slots.lockById(r.horarioId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND
                        )
                );

        if (!s.liberado ||
                s.data.atTime(s.hora)
                        .isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Horario indisponivel"
            );
        }

        if (!bookings.findByHorarioIdAndStatus(
                s.id, "AGENDADO"
        ).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Horario ocupado"
            );
        }

        var b = new Agendamento();

        b.animal = p;
        b.horario = s;
        b.tipo = r.tipo().toUpperCase(Locale.ROOT).contains("EXAME") ? "EXAME" : "CONSULTA";
        b.servico = "EXAME".equals(b.tipo) ? "Exame veterinário" : "Consulta veterinária";
        b.dataHora = s.data.atTime(s.hora);
        b.motivo = r.motivo();
        b.profissional = r.profissional();

        bookings.saveAndFlush(b);

        return bookingView(b);
    }

    // CANCELAR AGENDAMENTO

    @PatchMapping("/agendamentos/{id}/cancelar")
    @Transactional
    public Map<String, Object> cancel(
            Authentication a,
            @PathVariable Long id
    ) {
        var u = me(a);

        var b = bookings.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND
                        )
                );

        pet(b.animal.id, u);

        if (!b.status.equals("AGENDADO")) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT
            );
        }

        b.status = "CANCELADO";

        return bookingView(b);
    }

    // RELATÓRIOS DA CLÍNICA

    @GetMapping("/clinica/relatorios")
    public Map<String, Object> reports(
            @RequestParam LocalDate inicio,
            @RequestParam LocalDate fim
    ) {
        if (fim.isBefore(inicio)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST
            );
        }

        var lista = bookings.findAll()
                .stream()
                .filter(b ->
                        !b.horario.data.isBefore(inicio) &&
                        !b.horario.data.isAfter(fim)
                )
                .toList();

        return Map.of(
                "total", lista.size(),
                "cancelamentos",
                lista.stream()
                        .filter(b -> b.status.equals("CANCELADO"))
                        .count(),
                "consultas",
                lista.stream()
                        .filter(b -> b.tipo.equalsIgnoreCase("CONSULTA"))
                        .count(),
                "exames",
                lista.stream()
                        .filter(b -> b.tipo.equalsIgnoreCase("EXAME"))
                        .count(),
                "cirurgias",
                lista.stream()
                        .filter(b -> b.tipo.equalsIgnoreCase("CIRURGIA"))
                        .count(),
                "urgencias",
                lista.stream()
                        .filter(b -> b.tipo.equalsIgnoreCase("URGENCIA"))
                        .count()
        );
    }
}
