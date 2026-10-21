
package com.commitcompass.backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:8080",
    "https://commitcompass-frontend.onrender.com"
})
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        return "Welcome to CommitCompass!";
    }
}
