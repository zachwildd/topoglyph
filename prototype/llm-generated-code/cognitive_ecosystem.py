import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import networkx as nx
from collections import defaultdict

class CognitiveAgent:
    """Represents a cognitive agent with evolving problem-solving capabilities."""
    
    def __init__(self, agent_id, initial_capabilities=None):
        self.id = agent_id
        self.energy = 100
        self.knowledge = {}
        self.strategies = {}
        self.connections = set()
        self.performance_history = []
        
        # If no initial capabilities provided, generate random ones
        if initial_capabilities is None:
            self.capabilities = {
                'pattern_recognition': np.random.uniform(0.1, 1.0),
                'abstract_reasoning': np.random.uniform(0.1, 1.0),
                'memory_capacity': np.random.uniform(0.1, 1.0),
                'learning_rate': np.random.uniform(0.1, 1.0),
                'collaboration_tendency': np.random.uniform(0.1, 1.0)
            }
        else:
            self.capabilities = initial_capabilities
    
    def solve_problem(self, problem, available_knowledge=None):
        """Attempt to solve a problem, consuming energy and potentially gaining knowledge."""
        # Calculate solution quality based on agent capabilities and problem characteristics
        capability_match = sum(
            self.capabilities.get(req, 0) * weight 
            for req, weight in problem.requirements.items()
        ) / sum(problem.requirements.values())
        
        # Knowledge application improves solution quality
        knowledge_bonus = 0
        if available_knowledge:
            relevant_knowledge = set(available_knowledge.keys()) & set(problem.relevant_knowledge)
            if relevant_knowledge:
                knowledge_bonus = len(relevant_knowledge) / len(problem.relevant_knowledge) * 0.5
        
        # Calculate final solution quality (0-1)
        solution_quality = min(1.0, capability_match * (1 + knowledge_bonus))
        
        # Energy cost depends on problem difficulty and solution quality
        energy_cost = problem.difficulty * (1.5 - solution_quality)
        self.energy -= energy_cost
        
        # Potentially gain new knowledge from attempting the problem
        if solution_quality > 0.6 and np.random.random() < solution_quality:
            for k in problem.relevant_knowledge:
                if k not in self.knowledge:
                    self.knowledge[k] = min(1.0, solution_quality)
        
        # Update performance history
        self.performance_history.append(solution_quality)
        
        return solution_quality, energy_cost
    
    def collaborate(self, other_agent, problem=None):
        """Exchange knowledge and potentially collaborate on a problem with another agent."""
        # Add to connections
        self.connections.add(other_agent.id)
        other_agent.connections.add(self.id)
        
        # Knowledge exchange probability based on collaboration tendency
        exchange_prob = min(self.capabilities['collaboration_tendency'], 
                           other_agent.capabilities['collaboration_tendency'])
        
        # Exchange knowledge
        knowledge_exchanged = 0
        for k, quality in other_agent.knowledge.items():
            if k not in self.knowledge and np.random.random() < exchange_prob:
                self.knowledge[k] = quality * 0.9  # Slight degradation in transmission
                knowledge_exchanged += 1
                
        for k, quality in self.knowledge.items():
            if k not in other_agent.knowledge and np.random.random() < exchange_prob:
                other_agent.knowledge[k] = quality * 0.9
                knowledge_exchanged += 1
        
        # If problem provided, attempt collaborative solution
        if problem:
            # Pool knowledge
            combined_knowledge = {**self.knowledge, **other_agent.knowledge}
            
            # Average capabilities with slight boost for complementary skills
            combined_capabilities = {}
            for cap in set(self.capabilities.keys()) | set(other_agent.capabilities.keys()):
                self_val = self.capabilities.get(cap, 0)
                other_val = other_agent.capabilities.get(cap, 0)
                # Boost if complementary (one high, one low)
                if abs(self_val - other_val) > 0.4:
                    combined_capabilities[cap] = max(self_val, other_val) * 1.2
                else:
                    combined_capabilities[cap] = (self_val + other_val) / 2
            
            # Create temporary agent with combined capabilities
            temp_agent = CognitiveAgent(-1, combined_capabilities)
            solution_quality, _ = temp_agent.solve_problem(problem, combined_knowledge)
            
            # Share energy cost
            energy_cost = problem.difficulty * (1.5 - solution_quality) / 2
            self.energy -= energy_cost
            other_agent.energy -= energy_cost
            
            return solution_quality, knowledge_exchanged
        
        return 0, knowledge_exchanged
    
    def evolve(self):
        """Evolve capabilities based on performance history."""
        if not self.performance_history:
            return
        
        # Calculate average recent performance
        recent_performance = np.mean(self.performance_history[-5:]) if len(self.performance_history) >= 5 else np.mean(self.performance_history)
        
        # Adjust capabilities based on performance
        for capability in self.capabilities:
            # Small random adjustment
            random_change = np.random.normal(0, 0.05)
            
            # Performance-based adjustment
            if recent_performance < 0.3:  # Poor performance encourages more change
                performance_change = np.random.normal(0, 0.1)
            elif recent_performance > 0.7:  # Good performance encourages fine-tuning
                performance_change = np.random.normal(0, 0.03)
            else:
                performance_change = np.random.normal(0, 0.05)
            
            # Update capability with constraints
            self.capabilities[capability] = np.clip(
                self.capabilities[capability] + random_change + performance_change,
                0.1, 1.0
            )
    
    def reproduce(self, mutation_rate=0.1):
        """Create a new agent with similar but slightly modified capabilities."""
        # Energy check
        if self.energy < 50:
            return None
        
        # Create new capabilities with mutation
        new_capabilities = {}
        for cap, value in self.capabilities.items():
            mutation = np.random.normal(0, mutation_rate)
            new_capabilities[cap] = np.clip(value + mutation, 0.1, 1.0)
        
        # Create child agent
        child = CognitiveAgent(f"{self.id}_offspring", new_capabilities)
        
        # Transfer some knowledge (with degradation)
        for k, quality in self.knowledge.items():
            if np.random.random() < 0.7:  # 70% chance to transfer each knowledge item
                child.knowledge[k] = quality * 0.8
        
        # Energy cost
        self.energy -= 30
        
        return child


class Problem:
    """Represents a problem to be solved in the cognitive ecosystem."""
    
    def __init__(self, problem_id, difficulty=0.5):
        self.id = problem_id
        self.difficulty = difficulty
        
        # Generate random requirements for different cognitive capabilities
        self.requirements = {
            'pattern_recognition': np.random.uniform(0, 1),
            'abstract_reasoning': np.random.uniform(0, 1),
            'memory_capacity': np.random.uniform(0, 1),
            'learning_rate': np.random.uniform(0, 1),
            'collaboration_tendency': np.random.uniform(0, 1)
        }
        
        # Normalize requirements
        total = sum(self.requirements.values())
        for req in self.requirements:
            self.requirements[req] /= total
        
        # Generate relevant knowledge domains
        knowledge_domains = [
            'math', 'physics', 'biology', 'psychology', 'sociology',
            'computation', 'communication', 'resources', 'energy', 'structures'
        ]
        num_relevant = np.random.randint(2, 6)
        self.relevant_knowledge = np.random.choice(knowledge_domains, size=num_relevant, replace=False)


class CognitiveEcosystem:
    """Simulates a cognitive ecosystem with evolving agents solving problems."""
    
    def __init__(self, num_agents=20, num_problems=10):
        self.agents = [CognitiveAgent(f"agent_{i}") for i in range(num_agents)]
        self.problems = [Problem(f"problem_{i}", difficulty=np.random.uniform(0.3, 1.0)) 
                         for i in range(num_problems)]
        self.time = 0
        self.history = defaultdict(list)
        
        # Performance tracking
        self.performance_history = []
        self.diversity_history = []
        self.knowledge_growth = []
        self.collaboration_history = []
    
    def step(self):
        """Run one time step of the simulation."""
        self.time += 1
        
        # Problem assignment phase
        solutions = []
        for agent in self.agents:
            # Select a random problem
            problem = np.random.choice(self.problems)
            
            # Decide whether to collaborate
            if np.random.random() < agent.capabilities['collaboration_tendency'] and len(self.agents) > 1:
                # Select random collaboration partner
                partners = [a for a in self.agents if a.id != agent.id]
                if partners:
                    partner = np.random.choice(partners)
                    solution_quality, knowledge_exchanged = agent.collaborate(partner, problem)
                    solutions.append(solution_quality)
                    self.history['collaborations'].append((agent.id, partner.id, solution_quality))
            else:
                # Solve individually
                solution_quality, _ = agent.solve_problem(problem)
                solutions.append(solution_quality)
                self.history['individual_solutions'].append((agent.id, problem.id, solution_quality))
        
        # Resource replenishment phase
        for agent in self.agents:
            agent.energy += 10  # Base energy gain
            
            # Additional energy based on recent performance
            if agent.performance_history:
                recent_perf = agent.performance_history[-1]
                agent.energy += recent_perf * 20
            
            # Cap energy at 150
            agent.energy = min(agent.energy, 150)
        
        # Evolution phase
        for agent in self.agents:
            agent.evolve()
        
        # Reproduction phase
        new_agents = []
        for agent in self.agents:
            if agent.energy > 100 and np.random.random() < 0.2:  # 20% chance to reproduce if enough energy
                child = agent.reproduce()
                if child:
                    new_agents.append(child)
        
        self.agents.extend(new_agents)
        
        # Death phase
        self.agents = [agent for agent in self.agents if agent.energy > 0]
        
        # Record metrics
        self.performance_history.append(np.mean(solutions) if solutions else 0)
        self.diversity_history.append(self._calculate_diversity())
        self.knowledge_growth.append(self._calculate_total_knowledge())
        self.collaboration_history.append(sum(1 for a in self.agents if len(a.connections) > 0) / len(self.agents) if self.agents else 0)
        
        return {
            'num_agents': len(self.agents),
            'avg_performance': self.performance_history[-1],
            'diversity': self.diversity_history[-1],
            'knowledge': self.knowledge_growth[-1],
            'collaboration_rate': self.collaboration_history[-1]
        }
    
    def _calculate_diversity(self):
        """Calculate cognitive diversity of the agent population."""
        if not self.agents:
            return 0
            
        # Calculate variance in each capability
        variances = []
        for capability in ['pattern_recognition', 'abstract_reasoning', 'memory_capacity', 
                           'learning_rate', 'collaboration_tendency']:
            values = [agent.capabilities[capability] for agent in self.agents]
            variances.append(np.var(values))
        
        return np.mean(variances)
    
    def _calculate_total_knowledge(self):
        """Calculate total knowledge in the ecosystem."""
        all_knowledge = set()
        for agent in self.agents:
            all_knowledge.update(agent.knowledge.keys())
        return len(all_knowledge)
    
    def visualize_network(self):
        """Visualize the collaboration network among agents."""
        G = nx.Graph()
        
        # Add nodes
        for agent in self.agents:
            G.add_node(agent.id, 
                      size=len(agent.knowledge) + 5,
                      color=agent.capabilities['collaboration_tendency'])
        
        # Add edges from connections
        for agent in self.agents:
            for connection in agent.connections:
                if connection in [a.id for a in self.agents]:  # Ensure the connected agent still exists
                    G.add_edge(agent.id, connection)
        
        # Create visualization
        plt.figure(figsize=(10, 8))
        pos = nx.spring_layout(G)
        
        # Get node attributes for visualization
        node_sizes = [G.nodes[node]['size'] * 50 for node in G.nodes]
        node_colors = [G.nodes[node]['color'] for node in G.nodes]
        
        nx.draw_networkx(G, pos, 
                         node_size=node_sizes,
                         node_color=node_colors, 
                         cmap=plt.cm.viridis,
                         with_labels=True,
                         edge_color='gray',
                         alpha=0.8)
        
        plt.title(f"Collaboration Network at Time {self.time}")
        plt.axis('off')
        return plt.gcf()
    
    def plot_metrics(self):
        """Plot the history of key metrics."""
        time_range = range(1, self.time + 1)
        
        fig, axs = plt.subplots(2, 2, figsize=(15, 10))
        
        # Performance plot
        axs[0, 0].plot(time_range, self.performance_history, 'b-', label='Average Performance')
        axs[0, 0].set_title('Solution Quality Over Time')
        axs[0, 0].set_xlabel('Time Steps')
        axs[0, 0].set_ylabel('Average Solution Quality')
        axs[0, 0].grid(True)
        
        # Diversity plot
        axs[0, 1].plot(time_range, self.diversity_history, 'g-', label='Cognitive Diversity')
        axs[0, 1].set_title('Cognitive Diversity Over Time')
        axs[0, 1].set_xlabel('Time Steps')
        axs[0, 1].set_ylabel('Diversity (Capability Variance)')
        axs[0, 1].grid(True)
        
        # Knowledge growth plot
        axs[1, 0].plot(time_range, self.knowledge_growth, 'r-', label='Total Knowledge')
        axs[1, 0].set_title('Knowledge Growth Over Time')
        axs[1, 0].set_xlabel('Time Steps')
        axs[1, 0].set_ylabel('Total Knowledge Items')
        axs[1, 0].grid(True)
        
        # Collaboration rate plot
        axs[1, 1].plot(time_range, self.collaboration_history, 'm-', label='Collaboration Rate')
        axs[1, 1].set_title('Agent Collaboration Over Time')
        axs[1, 1].set_xlabel('Time Steps')
        axs[1, 1].set_ylabel('Proportion of Agents Collaborating')
        axs[1, 1].grid(True)
        
        plt.tight_layout()
        return fig

# Example usage
def run_simulation(num_steps=100, num_agents=20, num_problems=10):
    """Run a complete simulation and return results."""
    ecosystem = CognitiveEcosystem(num_agents=num_agents, num_problems=num_problems)
    results = []
    
    for _ in range(num_steps):
        step_results = ecosystem.step()
        results.append(step_results)
        
        # Optional: add conditions to stop simulation early
        if len(ecosystem.agents) == 0:
            print("All agents have died. Simulation terminated early.")
            break
    
    # Generate visualizations
    network_fig = ecosystem.visualize_network()
    metrics_fig = ecosystem.plot_metrics()
    
    return {
        'ecosystem': ecosystem,
        'results': results,
        'network_visualization': network_fig,
        'metrics_visualization': metrics_fig
    }

# To run the simulation:
# simulation_results = run_simulation(num_steps=100)
# plt.show()  # To display the visualizations