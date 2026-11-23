package br.com.vetrp.vetrp_web.config;

import br.com.vetrp.vetrp_web.model.Perfil;
import br.com.vetrp.vetrp_web.model.Usuario;
import br.com.vetrp.vetrp_web.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner criarAdministradorInicial(UsuarioRepository usuarios, PasswordEncoder encoder) {
        return args -> {
            String email = System.getenv("VETRP_ADMIN_EMAIL");
            String senha = System.getenv("VETRP_ADMIN_PASSWORD");
            if (email == null || email.isBlank() || senha == null || senha.length() < 10) {
                return;
            }
            if (usuarios.findByEmailIgnoreCase(email.trim()).isPresent()) {
                return;
            }
            Usuario admin = new Usuario();
            admin.nome = "Administrador VetRP";
            admin.email = email.trim().toLowerCase();
            admin.senhaHash = encoder.encode(senha);
            admin.perfil = Perfil.ADMIN;
            admin.ativo = true;
            usuarios.save(admin);
        };
    }
}
