import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

describe('GitHub Actions CI Workflow', () => {
  const workflowPath = resolve(process.cwd(), '.github/workflows/ci.yml');

  it('should have CI workflow file in correct location', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('should trigger on pull_request and push to main branch', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    expect(workflow.on).toEqual({
      push: { branches: ['main'] },
      pull_request: { branches: ['main'] }
    });
  });

  it('should use Node.js versions 18.x and 20.x in matrix strategy', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    expect(workflow.jobs.test.strategy.matrix['node-version']).toEqual(['18.x', '20.x']);
  });

  it('should install dependencies with npm ci', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const installStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Install dependencies'
    );
    expect(installStep.run).toBe('npm ci');
  });

  it('should include TypeScript compilation check', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const typeCheckStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'TypeScript compilation check'
    );
    expect(typeCheckStep.run).toBe('npm run build');
  });

  it('should run existing tests', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const testStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Run tests'
    );
    expect(testStep.run).toBe('npm test');
  });

  it('should build UI components', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const uiBuildStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Build UI'
    );
    expect(uiBuildStep.run).toBe('npm run build:ui');
  });

  it('should install UI dependencies separately', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const uiInstallStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Install UI dependencies'
    );
    expect(uiInstallStep.run).toBe('cd ui && npm ci');
  });

  it('should type check UI separately', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const uiTypeCheckStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Type check UI'
    );
    expect(uiTypeCheckStep.run).toBe('cd ui && npx tsc --noEmit');
  });

  it('should use proven GitHub Actions with Node caching', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    const checkoutStep = workflow.jobs.test.steps.find(
      (step: any) => step.name === 'Checkout code'
    );
    expect(checkoutStep.uses).toBe('actions/checkout@v4');

    const nodeStep = workflow.jobs.test.steps.find(
      (step: any) => step.name.startsWith('Use Node.js')
    );
    expect(nodeStep.uses).toBe('actions/setup-node@v4');
    expect(nodeStep.with.cache).toBe('npm');
  });

  it('should run on ubuntu-latest for compatibility', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    expect(workflow.jobs.test['runs-on']).toBe('ubuntu-latest');
  });

  it('should fail workflow if any step fails', () => {
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parseYaml(content);
    
    // All steps should run unconditionally (no failure handling that would hide errors)
    const steps = workflow.jobs.test.steps;
    const hasFailureHandling = steps.some((step: any) => 
      step.if && step.if.includes('failure()')
    );
    expect(hasFailureHandling).toBe(false);
  });
});
