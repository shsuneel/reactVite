# src/test/resources/features/google_search.feature
Feature: Google Search

  Scenario: Search for Cucumber
    Given I am on the Google homepage
    When I search for "Cucumber"
    Then the page title should contain "Cucumber"