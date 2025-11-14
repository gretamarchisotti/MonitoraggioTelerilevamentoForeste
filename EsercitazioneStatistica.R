#Exercise - Power analysis
#B5193 - MONITORAGGIO, PROTEZIONE E RIPRISTINO DI VEGETAZIONE E PAESAGGIO - Alma Mater Studiorum - UniversitÃ  di Bologna


## MARCHISOTTI


## Make sure you unpacked (unzipped) the folder containing this script 
## into a target folder. If you haven't, close RStudio and 
## reopen this file once done.

#Load libraries
library(pwr)

#If these aren't available in your PC, 
#type: `install.packages("pwr")`. 
# and then run the library commands above
#Packages only need to be installed once on a computer.  


# This is how you make a comment, by the way. 

#Import Plot-level information and species data:
species <- read.csv("Species_subset.csv", header=T, row.names = 1, check.names = F ) 
header <- read.csv("Header_subset.csv", header=T, row.names = 1, sep=",")

# Answer 0.1 - example....

species <- read.csv("Species_subset.csv", header=T, row.names = 1, check.names = F )
species[1:5, 1:5] #only first 5 species and plots shown

header <- read.csv("Header_subset.csv", header=T, row.names = 1, sep=",")


# Calcolo la ricchezza di specie
header$SR <- rowSums(species>0)

table(header$Gestione, header$Vegetazione.short)

par(mfrow=c(1,2)) #creates panel of two graphs
boxplot(SR ~ Gestione, data=header)
boxplot(SR ~ Vegetazione.short, data=header)

n <- 12
mymeans <- tapply(header$SR, FUN = "mean", header$Gestione)
mymeans

mysds <- tapply(header$SR, FUN = "sd", header$Gestione)
mysds

es <- mysds/sqrt(n)
es

alpha <- 0.05
t0.05 <- qt(p=(1-alpha/2), df = n-1) #two-sided!
t0.05

unmanaged95 <- c(mymeans[1] - t0.05*es[1], mymeans[1] + t0.05*es[1])
unmanaged95

pastures95 <- c(mymeans[2] - t0.05*es[2], mymeans[2] + t0.05*es[2])
pastures95

t.test(SR ~ Gestione, data=header, alternative="two.sided", var.equal=F)

MDC <- round(max(mymeans)*0.10)
MDC

pooled.variance <- ((n-1)*mysds[1]^2 + (n-1)*mysds[2]^2 ) / (n+n-2)
names(pooled.variance) <- "pooled"
pooled.sd <- sqrt(pooled.variance)
pooled.sd

sd(header$SR)

mypower <- pwr.t.test(d=MDC/pooled.sd,
                      n=12,
                      sig.level = 0.05,
                      alternative = "two.sided"
)
mypower

plot(mypower)

#Q0.1

# ----------------------------------------------------
# ESERCIZIO 1
power_es1 <- pwr.t.test(d=10/pooled.sd,
                      power = 0.8,
                      sig.level = 0.05,
                      alternative = "two.sided",
                      type = "two.sample"
)
power_es1

plot(power_es1)

#Q1.1

#-----------------------------------------------------
# ESERCIZIO 2
power_es2 <- pwr.t.test(n = 50,
                        power = 0.8,
                        sig.level = 0.05,
                        alternative = "two.sided",
                        type = "two.sample"
)
power_es2

#Q2.1
MDC_es2 <- 0.565858*pooled.sd
names(MDC_es2) <- "MDC_es2"
MDC_es2

#----------------------------------------------------
#ESERCIZIO 3
MDC_es3 <- 0.3*pooled.sd
names(MDC_es3) <- "MDC_es3"
MDC_es3

power_es3 <- pwr.t.test(n = 50,
                        d = 0.3,
                        sig.level = 0.05,
                        alternative = "two.sided",
                        type = "two.sample"
)
power_es3

#Q3.1

#---------------------------------------------------
#ESERCIZIO 4
n_es4 <- c(10, 20, 30, 40, 50, 100, 200, 300, 500, 1000)
power_es4 <- pwr.t.test(n = n_es4,
                           d = 0.3,
                           sig.level = 0.05,
                           alternative = "two.sided",
                           type = "two.sample"
)
power_es4

plot(power_es4)

plot(power_es4$n, power_es4$power, type = "l")

#Q4.1

#---------------------------------------------------
#ESERCIZIO 5
MDC_es5 <- c(1, 2, 5, 8, 10)
power_es5 <- pwr.t.test(n = 100,
                        d = MDC_es5/pooled.sd,
                        sig.level = 0.05,
                        alternative = "two.sided",
                        type = "two.sample"
)
power_es5

plot(power_es5$d, power_es5$power, type = "l")
