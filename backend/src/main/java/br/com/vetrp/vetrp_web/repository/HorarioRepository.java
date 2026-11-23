package br.com.vetrp.vetrp_web.repository;

import br.com.vetrp.vetrp_web.model.Horario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from Horario h where h.id = :id")
    Optional<Horario> lockById(@Param("id") Long id);

    Optional<Horario> findByDataAndHora(LocalDate data, LocalTime hora);
}
