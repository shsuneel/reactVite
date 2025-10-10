// src/test/java/runner/TestRunner.java
package runner;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
@CucumberOptions(
    features = "src/test/resources/features",      // Path to .feature files
    glue = {"hooks", "steps"},                     // Packages with step defs & hooks
    plugin = {"pretty", "html:target/cucumber-reports"},
    monochrome = true,
    dryRun = false
)
public class TestRunner {
    // This class remains empty — it's just a runner
}