// src/test/java/steps/GoogleSearchSteps.java
package steps;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import hooks.Hooks;
import org.junit.Assert;

public class GoogleSearchSteps {

    @Given("I am on the Google homepage")
    public void i_am_on_google_homepage() {
        Hooks.driver.get("https://www.google.com");
    }

    @When("I search for {string}")
    public void i_search_for(String query) {
        Hooks.googlePage.search(query);
    }

    @Then("the page title should contain {string}")
    public void page_title_should_contain(String expected) {
        String title = Hooks.driver.getTitle();
        Assert.assertTrue(title.toLowerCase().contains(expected.toLowerCase()));
    }
}