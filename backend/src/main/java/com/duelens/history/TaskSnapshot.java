package com.duelens.history;

import java.time.LocalDate;
import java.util.UUID;
import com.duelens.courses.Course;

public record TaskSnapshot(String term, UUID courseId, String courseName, String section, String title,
        LocalDate dueDate, String dueTime, String status, String submissionFormat, String quantity,
        String submissionUrl, String description) {
    public TaskSnapshot withCourse(Course course) {
        return new TaskSnapshot(course.term(), course.id(), course.name(), course.section(), title, dueDate, dueTime,
                status, submissionFormat, quantity, submissionUrl, description);
    }
}
