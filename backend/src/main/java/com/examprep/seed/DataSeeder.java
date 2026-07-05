package com.examprep.seed;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.examprep.course.Course;
import com.examprep.course.CourseRepository;
import com.examprep.note.Note;
import com.examprep.note.NoteRepository;
import com.examprep.note.NoteType;
import com.examprep.topic.Topic;
import com.examprep.topic.TopicRepository;
import com.examprep.user.User;
import com.examprep.user.UserRepository;

/**
 * Seeds a demo user with sample courses/topics/notes on first run of the local profile,
 * so the app is testable immediately without manual data entry.
 * Login: demo@example.com / password123
 */
@Component
@Profile("local")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final TopicRepository topicRepository;
    private final NoteRepository noteRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, CourseRepository courseRepository,
            TopicRepository topicRepository, NoteRepository noteRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.topicRepository = topicRepository;
        this.noteRepository = noteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail("demo@example.com")) {
            return;
        }

        User demo = userRepository.save(
            new User("demo@example.com", passwordEncoder.encode("password123"), "Demo Student"));

        Course biology = courseRepository.save(new Course(demo.getId(), "Cell Biology",
            LocalDate.now().plusDays(12), "Intro to cell structure, organelles and division"));
        Course history = courseRepository.save(new Course(demo.getId(), "Modern European History",
            LocalDate.now().plusDays(30), "1789–1945: revolutions, unification, world wars"));
        Course algorithms = courseRepository.save(new Course(demo.getId(), "Algorithms & Data Structures",
            LocalDate.now().plusDays(5), "Sorting, graphs, complexity analysis"));

        topicRepository.save(new Topic(biology.getId(), "The Cell Membrane", """
            The cell membrane is a phospholipid bilayer with embedded proteins. It is \
            selectively permeable: small non-polar molecules diffuse freely, while ions \
            and large polar molecules need channel or carrier proteins. Transport types: \
            passive (diffusion, osmosis, facilitated diffusion — no energy) and active \
            (against gradient, uses ATP, e.g. the sodium-potassium pump which moves 3 Na+ \
            out and 2 K+ in per ATP)."""));
        topicRepository.save(new Topic(biology.getId(), "Mitochondria and Respiration", """
            Mitochondria are the site of aerobic respiration. Glycolysis happens in the \
            cytoplasm (glucose -> 2 pyruvate, net 2 ATP). The Krebs cycle runs in the \
            matrix, producing NADH and FADH2. The electron transport chain on the inner \
            membrane uses these to pump protons and drive ATP synthase — around 30-32 ATP \
            per glucose in total. Mitochondria have their own circular DNA, supporting \
            the endosymbiotic theory."""));
        topicRepository.save(new Topic(biology.getId(), "Mitosis", """
            Mitosis produces two genetically identical diploid cells. Phases (PMAT): \
            Prophase — chromosomes condense, spindle forms; Metaphase — chromosomes align \
            at the equator; Anaphase — sister chromatids pulled apart; Telophase — nuclear \
            envelopes reform, followed by cytokinesis."""));

        topicRepository.save(new Topic(history.getId(), "The French Revolution", """
            1789: Estates-General, storming of the Bastille (July 14). Causes: fiscal \
            crisis, Enlightenment ideas, social inequality of the three estates. Key \
            phases: constitutional monarchy (1789-92), radical republic and Terror under \
            Robespierre (1793-94), Directory (1795-99), ending with Napoleon's coup of \
            18 Brumaire."""));
        topicRepository.save(new Topic(history.getId(), "German Unification", """
            Otto von Bismarck unified Germany through three wars: against Denmark (1864), \
            Austria (1866, Seven Weeks' War), and France (1870-71). The German Empire was \
            proclaimed in the Hall of Mirrors at Versailles in January 1871. Realpolitik \
            and "blood and iron" over liberal idealism."""));

        topicRepository.save(new Topic(algorithms.getId(), "Sorting Algorithms", """
            Bubble/insertion/selection sort: O(n^2). Merge sort: O(n log n), stable, \
            O(n) extra space. Quicksort: average O(n log n), worst O(n^2) on sorted input \
            with naive pivot, in-place. Heapsort: O(n log n), in-place, not stable. \
            Counting/radix sort: linear time for bounded integer keys."""));
        topicRepository.save(new Topic(algorithms.getId(), "Graph Traversal", """
            BFS uses a queue, finds shortest paths in unweighted graphs, O(V+E). DFS uses \
            a stack/recursion, useful for cycle detection, topological sort, connected \
            components. Dijkstra finds shortest paths with non-negative weights using a \
            priority queue: O((V+E) log V). For negative edges use Bellman-Ford."""));

        noteRepository.save(new Note(biology.getId(), null, NoteType.TEXT,
            "Remember: 3 Na+ OUT, 2 K+ IN — the pump makes the inside negative.", null));
        noteRepository.save(new Note(algorithms.getId(), null, NoteType.TEXT,
            "Exam tip: always state best/average/worst case AND space complexity.", null));

        log.info("Seeded demo data: user demo@example.com / password123 with 3 courses");
    }
}
